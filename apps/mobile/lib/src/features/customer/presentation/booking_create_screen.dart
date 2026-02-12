import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_error.dart';
import '../application/customer_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_toast.dart';

class BookingCreateScreen extends ConsumerStatefulWidget {
  const BookingCreateScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.helperId,
  });

  final String categoryId;
  final String categoryName;
  final String helperId;

  @override
  ConsumerState<BookingCreateScreen> createState() => _BookingCreateScreenState();
}

class _BookingCreateScreenState extends ConsumerState<BookingCreateScreen> {
  final notesController = TextEditingController();
  final labelController = TextEditingController(text: "Home");
  final line1Controller = TextEditingController();
  String scheduleMode = "now";
  String? selectedAddressId;
  bool isSubmitting = false;

  @override
  void dispose() {
    notesController.dispose();
    labelController.dispose();
    line1Controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => isSubmitting = true);
    try {
      final repo = ref.read(customerRepositoryProvider);
      String? addressId = selectedAddressId;
      if (addressId == null) {
        final created = await repo.createAddress(
          label: labelController.text.trim().isEmpty ? "Home" : labelController.text.trim(),
          line1: line1Controller.text.trim().isEmpty ? "Bangalore" : line1Controller.text.trim(),
        );
        addressId = created.id;
      }
      final bookingId = await repo.createBooking(
        categoryId: widget.categoryId,
        addressId: addressId,
        notes: notesController.text,
        scheduledAt: scheduleMode == "scheduled" ? DateTime.now().add(const Duration(hours: 2)) : null,
      );
      if (!mounted) return;
      context.go("/customer/booking/track?id=$bookingId");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Create Booking")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text("Category: ${widget.categoryName}"),
          const SizedBox(height: AppSpacing.sm),
          Text("Helper ID: ${widget.helperId}"),
          const SizedBox(height: AppSpacing.md),
          addresses.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text("Could not load addresses"),
            data: (items) => DropdownButtonFormField<String>(
              initialValue: selectedAddressId,
              items: items
                  .map((a) => DropdownMenuItem<String>(value: a.id, child: Text("${a.label}: ${a.line1}")))
                  .toList(),
              onChanged: (value) => setState(() => selectedAddressId = value),
              decoration: const InputDecoration(
                labelText: "Select address (or add below)",
                border: OutlineInputBorder(),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: labelController, label: "New address label"),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: line1Controller, label: "New address line1"),
          const SizedBox(height: AppSpacing.md),
          const Text("Schedule"),
          const SizedBox(height: AppSpacing.xs),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: "now", label: Text("Now")),
              ButtonSegment(value: "scheduled", label: Text("Schedule")),
            ],
            selected: {scheduleMode},
            onSelectionChanged: (value) {
              setState(() => scheduleMode = value.first);
            },
          ),
          const SizedBox(height: AppSpacing.md),
          AppTextField(controller: notesController, label: "Notes", maxLines: 3),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: "Confirm Booking",
            isLoading: isSubmitting,
            onPressed: _submit,
          )
        ],
      ),
    );
  }
}
