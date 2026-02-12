import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_toast.dart';
import '../../booking/application/booking_controller.dart';
import '../application/customer_controller.dart';

class DisputeScreen extends ConsumerStatefulWidget {
  const DisputeScreen({super.key});

  @override
  ConsumerState<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends ConsumerState<DisputeScreen> {
  final bookingIdController = TextEditingController();
  final reasonController = TextEditingController();
  bool isBusy = false;
  Map<String, dynamic>? dispute;

  @override
  void dispose() {
    bookingIdController.dispose();
    reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => isBusy = true);
    try {
      final data = await ref.read(customerRepositoryProvider).raiseDispute(
            bookingId: bookingIdController.text.trim(),
            reason: reasonController.text.trim(),
          );
      if (!mounted) return;
      setState(() => dispute = data);
      showAppToast(context, "Dispute submitted");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookings = ref.watch(myBookingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Raise Dispute")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(
            child: Text("Raise a dispute only for your own completed/paid jobs."),
          ),
          const SizedBox(height: AppSpacing.md),
          bookings.when(
            data: (rows) {
              if (rows.isEmpty) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Pick from my bookings"),
                  const SizedBox(height: AppSpacing.xs),
                  DropdownButtonFormField<String>(
                    initialValue: null,
                    decoration: const InputDecoration(labelText: "Booking"),
                    items: rows
                        .map(
                          (b) => DropdownMenuItem(
                            value: b.id,
                            child: Text("${b.id.substring(0, 8)} • ${b.status}"),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      bookingIdController.text = value;
                    },
                  ),
                  const SizedBox(height: AppSpacing.sm),
                ],
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          AppTextField(controller: bookingIdController, label: "Booking ID"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(controller: reasonController, label: "Dispute reason"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Submit Dispute",
            isLoading: isBusy,
            onPressed: _submit,
          ),
          if (dispute != null) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(child: Text(jsonEncode(dispute))),
          ]
        ],
      ),
    );
  }
}
