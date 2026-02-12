import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_error.dart';
import '../application/helper_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_toast.dart';

class HelperJobDetailsScreen extends ConsumerStatefulWidget {
  const HelperJobDetailsScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  ConsumerState<HelperJobDetailsScreen> createState() => _HelperJobDetailsScreenState();
}

class _HelperJobDetailsScreenState extends ConsumerState<HelperJobDetailsScreen> {
  bool isBusy = false;

  Future<void> _accept() async {
    setState(() => isBusy = true);
    try {
      await ref.read(helperRepositoryProvider).acceptBooking(widget.bookingId);
      if (!mounted) return;
      ref.invalidate(helperJobsProvider);
      showAppToast(context, "Booking accepted");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> _decline() async {
    setState(() => isBusy = true);
    try {
      await ref.read(helperRepositoryProvider).declineBooking(widget.bookingId);
      if (!mounted) return;
      ref.invalidate(helperJobsProvider);
      showAppToast(context, "Booking declined");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> _status(String status) async {
    setState(() => isBusy = true);
    try {
      await ref.read(helperRepositoryProvider).updateStatus(
            bookingId: widget.bookingId,
            status: status,
          );
      if (status == "enroute") {
        await ref.read(helperRepositoryProvider).sendLocation(
              bookingId: widget.bookingId,
              lat: 12.9352,
              lng: 77.6245,
            );
      }
      if (!mounted) return;
      ref.invalidate(helperJobsProvider);
      showAppToast(context, "Status updated: $status");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Job Details")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(child: Text("Booking ${widget.bookingId}")),
          const SizedBox(height: AppSpacing.sm),
          const AppCard(child: Text("Actions: accept/decline, enroute, started, completed.")),
          const SizedBox(height: AppSpacing.md),
          AppButton(label: "Accept Booking", isLoading: isBusy, onPressed: _accept),
          const SizedBox(height: AppSpacing.sm),
          AppButton(label: "Decline Booking", isLoading: isBusy, onPressed: _decline),
          const SizedBox(height: AppSpacing.sm),
          AppButton(label: "Set Enroute", isLoading: isBusy, onPressed: () => _status("enroute")),
          const SizedBox(height: AppSpacing.sm),
          AppButton(label: "Set Started", isLoading: isBusy, onPressed: () => _status("started")),
          const SizedBox(height: AppSpacing.sm),
          AppButton(label: "Set Completed", isLoading: isBusy, onPressed: () => _status("completed")),
        ],
      ),
    );
  }
}
