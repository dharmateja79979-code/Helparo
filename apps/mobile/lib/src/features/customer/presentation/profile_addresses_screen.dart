import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../application/customer_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_text_field.dart';

class ProfileAddressesScreen extends ConsumerStatefulWidget {
  const ProfileAddressesScreen({super.key});

  @override
  ConsumerState<ProfileAddressesScreen> createState() => _ProfileAddressesScreenState();
}

class _ProfileAddressesScreenState extends ConsumerState<ProfileAddressesScreen> {
  final labelController = TextEditingController(text: "Home");
  final line1Controller = TextEditingController();
  bool isAdding = false;

  @override
  void dispose() {
    labelController.dispose();
    line1Controller.dispose();
    super.dispose();
  }

  Future<void> _addAddress() async {
    setState(() => isAdding = true);
    try {
      await ref.read(customerRepositoryProvider).createAddress(
            label: labelController.text.trim().isEmpty ? "Home" : labelController.text.trim(),
            line1: line1Controller.text.trim().isEmpty ? "Bangalore" : line1Controller.text.trim(),
          );
      ref.invalidate(addressesProvider);
      line1Controller.clear();
    } finally {
      if (mounted) setState(() => isAdding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Profile & Addresses")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(child: Text("Name, email, phone and plan (free/premium hook).")),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(controller: labelController, label: "Label"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(controller: line1Controller, label: "Address line1"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(label: "Add Address", isLoading: isAdding, onPressed: _addAddress),
          const SizedBox(height: AppSpacing.md),
          addresses.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const AppCard(child: Text("Failed to load addresses")),
            data: (rows) => Column(
              children: rows
                  .map((a) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: AppCard(child: Text("${a.label} - ${a.line1}")),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}
