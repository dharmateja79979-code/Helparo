import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../booking/application/booking_controller.dart';
import '../application/customer_controller.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/status_theme.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_toast.dart';

class BookingTrackingScreen extends ConsumerStatefulWidget {
  const BookingTrackingScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  ConsumerState<BookingTrackingScreen> createState() =>
      _BookingTrackingScreenState();
}

class _BookingTrackingScreenState extends ConsumerState<BookingTrackingScreen> {
  final messageController = TextEditingController();
  final amountController = TextEditingController(text: "500");
  String paymentMethod = "upi";
  bool isBusy = false;
  final ImagePicker picker = ImagePicker();

  @override
  void dispose() {
    messageController.dispose();
    amountController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    setState(() => isBusy = true);
    try {
      await ref.read(customerRepositoryProvider).sendMessage(
            bookingId: widget.bookingId,
            body: messageController.text.trim(),
          );
      messageController.clear();
      ref.invalidate(bookingTimelineProvider(widget.bookingId));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> _recordPayment() async {
    setState(() => isBusy = true);
    try {
      final amount = double.tryParse(amountController.text.trim()) ?? 0;
      await ref.read(customerRepositoryProvider).recordPayment(
            bookingId: widget.bookingId,
            method: paymentMethod,
            amount: amount,
          );
      ref.invalidate(bookingTimelineProvider(widget.bookingId));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> _cancelBooking() async {
    setState(() => isBusy = true);
    try {
      await ref
          .read(customerRepositoryProvider)
          .cancelBooking(widget.bookingId);
      if (!mounted) return;
      ref.invalidate(bookingTimelineProvider(widget.bookingId));
      showAppToast(context, "Booking cancelled");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> _uploadIssueMedia() async {
    final file =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    setState(() => isBusy = true);
    try {
      final bytes = await file.readAsBytes();
      await ref.read(customerRepositoryProvider).uploadBookingMedia(
            bookingId: widget.bookingId,
            bytes: bytes,
            fileName: file.name,
            contentType: "image/jpeg",
            type: "issue",
          );
      ref
          .read(bookingRepositoryProvider)
          .clearMediaCacheForBooking(widget.bookingId);
      if (!mounted) return;
      ref.invalidate(bookingTimelineProvider(widget.bookingId));
      showAppToast(context, "Image uploaded");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingId = widget.bookingId;
    final timeline = ref.watch(bookingTimelineProvider(bookingId));
    final realtime = ref.watch(bookingRealtimeProvider(bookingId));
    final messageRealtime = ref.watch(bookingMessagesRealtimeProvider(bookingId));
    ref.listen(bookingMessagesRealtimeProvider(bookingId), (_, next) {
      next.whenData((rows) {
        if (rows.isNotEmpty) {
          ref.invalidate(bookingTimelineProvider(bookingId));
        }
      });
    });
    return Scaffold(
      appBar: AppBar(title: const Text("Booking Tracking")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text("Booking: $bookingId"),
          const SizedBox(height: AppSpacing.sm),
          timeline.when(
            data: (data) {
              final sections = _groupEventsByDay(data.events);
              return Column(children: [
                ...sections.map(
                  (section) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        section.label,
                        style: const TextStyle(
                          fontSize: AppTypography.sm,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      ...section.events.map(
                        (event) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                          child: AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  spacing: AppSpacing.xs,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Text((event["type"] ?? "event").toString()),
                                    if ((event["to_status"] ?? "")
                                        .toString()
                                        .isNotEmpty)
                                      Chip(
                                        label: Text((event["to_status"] ?? "")
                                            .toString()),
                                      backgroundColor: statusColor(
                                        (event["to_status"] ?? "").toString(),
                                        Theme.of(context).colorScheme,
                                      ).withValues(alpha: 0.15),
                                        side: BorderSide(
                                          color: statusColor(
                                            (event["to_status"] ?? "")
                                                .toString(),
                                            Theme.of(context).colorScheme,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: AppSpacing.xs),
                                Text(
                                  _formatTs(
                                      (event["created_at"] ?? "").toString()),
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (data.media.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Media",
                      style: TextStyle(
                          fontSize: AppTypography.md,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  _MediaGrid(
                    bookingId: bookingId,
                    media: data.media,
                  ),
                ],
                if (data.messages.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Messages",
                      style: TextStyle(
                        fontSize: AppTypography.md,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  ...data.messages.map(
                    (m) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                      child: AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text((m["body"] ?? "").toString()),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              _formatTs((m["created_at"] ?? "").toString()),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ]);
            },
            loading: () => const LinearProgressIndicator(),
            error: (_, __) =>
                const AppCard(child: Text("Could not load timeline")),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            children: [
              realtime.when(
                data: (_) => _connectionChip("Events Live", true),
                loading: () => _connectionChip("Events Connecting", false),
                error: (_, __) => _connectionChip("Events Offline", false),
              ),
              messageRealtime.when(
                data: (_) => _connectionChip("Messages Live", true),
                loading: () => _connectionChip("Messages Connecting", false),
                error: (_, __) => _connectionChip("Messages Offline", false),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const AppCard(
            child:
                Text("Chat and media are available in this booking timeline."),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: messageController, label: "Message"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
              label: "Send Message",
              isLoading: isBusy,
              onPressed: _sendMessage),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
              label: "Upload Issue Photo",
              isLoading: isBusy,
              onPressed: _uploadIssueMedia),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: paymentMethod,
            items: const [
              DropdownMenuItem(value: "upi", child: Text("UPI")),
              DropdownMenuItem(value: "cash", child: Text("Cash")),
              DropdownMenuItem(value: "cashfree", child: Text("Cashfree")),
            ],
            onChanged: (value) =>
                setState(() => paymentMethod = value ?? "upi"),
            decoration: const InputDecoration(
                labelText: "Payment method", border: OutlineInputBorder()),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(
              controller: amountController,
              label: "Amount",
              keyboardType: TextInputType.number),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
              label: "Record Payment",
              isLoading: isBusy,
              onPressed: _recordPayment),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
              label: "Cancel Booking",
              isLoading: isBusy,
              onPressed: _cancelBooking),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: "Leave Review",
            onPressed: () =>
                context.go("/customer/review?bookingId=$bookingId"),
          )
        ],
      ),
    );
  }
}

class _MediaGrid extends StatelessWidget {
  const _MediaGrid({required this.bookingId, required this.media});

  final String bookingId;
  final List<Map<String, dynamic>> media;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: media.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: AppSpacing.xs,
        mainAxisSpacing: AppSpacing.xs,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, index) => _MediaPreviewTile(
        bookingId: bookingId,
        media: media[index],
      ),
    );
  }
}

class _MediaPreviewTile extends ConsumerWidget {
  const _MediaPreviewTile({required this.bookingId, required this.media});

  final String bookingId;
  final Map<String, dynamic> media;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaId = (media["id"] ?? "").toString();
    if (mediaId.isEmpty) {
      return AppCard(
        child: Text((media["storage_path"] ?? "").toString()),
      );
    }
    final signedUrl = ref.watch(
      bookingMediaUrlProvider((bookingId: bookingId, mediaId: mediaId)),
    );
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () {
        signedUrl.whenData((url) {
          if (url.isEmpty) return;
          showDialog<void>(
            context: context,
            builder: (_) => Dialog(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.network(
                    url,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Padding(
                      padding: EdgeInsets.all(AppSpacing.md),
                      child: Text("Could not render image"),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    child: Text((media["storage_path"] ?? "").toString()),
                  )
                ],
              ),
            ),
          );
        });
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: signedUrl.when(
          data: (url) => url.isEmpty
              ? Container(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: const Center(
                      child: Icon(Icons.image_not_supported_outlined)),
                )
              : Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color:
                        Theme.of(context).colorScheme.surfaceContainerHighest,
                    child:
                        const Center(child: Icon(Icons.broken_image_outlined)),
                  ),
                ),
          loading: () => Container(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child:
                const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (_, __) => Container(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: const Center(child: Icon(Icons.error_outline)),
          ),
        ),
      ),
    );
  }
}

class _TimelineSection {
  const _TimelineSection({required this.label, required this.events});

  final String label;
  final List<Map<String, dynamic>> events;
}

List<_TimelineSection> _groupEventsByDay(List<Map<String, dynamic>> events) {
  final buckets = <String, List<Map<String, dynamic>>>{};
  for (final event in events) {
    final key = _dayKey((event["created_at"] ?? "").toString());
    buckets.putIfAbsent(key, () => <Map<String, dynamic>>[]).add(event);
  }
  final keys = buckets.keys.toList()..sort((a, b) => b.compareTo(a));
  return keys
      .map(
        (key) => _TimelineSection(
          label: _dayLabelFromKey(key),
          events: buckets[key] ?? const <Map<String, dynamic>>[],
        ),
      )
      .toList();
}

String _dayKey(String raw) {
  final dt = DateTime.tryParse(raw)?.toLocal();
  if (dt == null) return "unknown";
  String two(int n) => n < 10 ? "0$n" : "$n";
  return "${dt.year}-${two(dt.month)}-${two(dt.day)}";
}

String _dayLabelFromKey(String key) {
  if (key == "unknown") return "Unknown Date";
  final dt = DateTime.tryParse("${key}T00:00:00");
  if (dt == null) return key;
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(dt.year, dt.month, dt.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) return "Today";
  if (diff == 1) return "Yesterday";
  return key;
}

String _formatTs(String raw) {
  final dt = DateTime.tryParse(raw);
  if (dt == null) return raw;
  final local = dt.toLocal();
  String two(int n) => n < 10 ? "0$n" : "$n";
  return "${local.year}-${two(local.month)}-${two(local.day)} ${two(local.hour)}:${two(local.minute)}";
}

Widget _connectionChip(String label, bool live) {
  return Chip(
    label: Text(label),
    avatar: Icon(
      Icons.circle,
      size: 10,
      color: live ? Colors.green : Colors.orange,
    ),
  );
}
