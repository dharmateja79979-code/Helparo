import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_toast.dart';
import '../application/customer_controller.dart';

class CorporateScreen extends ConsumerStatefulWidget {
  const CorporateScreen({super.key});

  @override
  ConsumerState<CorporateScreen> createState() => _CorporateScreenState();
}

class _CorporateScreenState extends ConsumerState<CorporateScreen> {
  final accountNameController = TextEditingController();
  final cityController = TextEditingController(text: "Bangalore");
  final corporateIdController = TextEditingController();
  final bookingIdController = TextEditingController();
  final memberUserIdController = TextEditingController();
  String role = "member";
  bool isBusy = false;
  List<Map<String, dynamic>> rows = const [];

  @override
  void dispose() {
    accountNameController.dispose();
    cityController.dispose();
    corporateIdController.dispose();
    bookingIdController.dispose();
    memberUserIdController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action, {String? okMessage}) async {
    setState(() => isBusy = true);
    try {
      await action();
      if (!mounted) return;
      if (okMessage != null) showAppToast(context, okMessage);
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final repo = ref.read(customerRepositoryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Corporate")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(child: Text("Manage corporate account mappings.")),
          const SizedBox(height: AppSpacing.md),
          AppTextField(controller: accountNameController, label: "Account name"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(controller: cityController, label: "City"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Create Account",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              final data = await repo.createCorporateAccount(
                name: accountNameController.text.trim(),
                city: cityController.text.trim(),
              );
              if (!mounted) return;
              corporateIdController.text = (data["id"] ?? "").toString();
            }, okMessage: "Corporate account created"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: corporateIdController, label: "Corporate ID"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(controller: bookingIdController, label: "Booking ID"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Map Booking",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              await repo.createCorporateBooking(
                corporateId: corporateIdController.text.trim(),
                bookingId: bookingIdController.text.trim(),
              );
            }, okMessage: "Booking mapped"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: memberUserIdController, label: "Member user ID"),
          const SizedBox(height: AppSpacing.xs),
          DropdownButtonFormField<String>(
            initialValue: role,
            decoration: const InputDecoration(labelText: "Role"),
            items: const [
              DropdownMenuItem(value: "member", child: Text("Member")),
              DropdownMenuItem(value: "manager", child: Text("Manager")),
              DropdownMenuItem(value: "owner", child: Text("Owner")),
            ],
            onChanged: (v) {
              if (v == null) return;
              setState(() => role = v);
            },
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Add Member",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              await repo.addCorporateMember(
                corporateId: corporateIdController.text.trim(),
                userId: memberUserIdController.text.trim(),
                role: role,
              );
            }, okMessage: "Member updated"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppButton(
            label: "Refresh Members",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              final members = await repo.listCorporateMembers(
                corporateId: corporateIdController.text.trim(),
              );
              if (!mounted) return;
              setState(() => rows = members);
            }),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Refresh Corporate Bookings",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              final bookings = await repo.listCorporateBookings();
              if (!mounted) return;
              setState(() => rows = bookings);
            }),
          ),
          if (rows.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            ...rows.take(8).map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: AppCard(child: Text(jsonEncode(e))),
                  ),
                )
          ]
        ],
      ),
    );
  }
}
