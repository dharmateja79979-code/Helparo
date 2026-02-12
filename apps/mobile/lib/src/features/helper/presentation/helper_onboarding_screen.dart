import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_error.dart';
import '../application/helper_controller.dart';
import '../../customer/application/customer_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_toast.dart';

class HelperOnboardingScreen extends ConsumerStatefulWidget {
  const HelperOnboardingScreen({super.key});

  @override
  ConsumerState<HelperOnboardingScreen> createState() => _HelperOnboardingScreenState();
}

class _HelperOnboardingScreenState extends ConsumerState<HelperOnboardingScreen> {
  final bioController = TextEditingController();
  final priceController = TextEditingController();
  bool isSaving = false;
  final Set<String> selectedServiceIds = {};
  final Set<String> selectedZoneIds = {};

  @override
  void dispose() {
    bioController.dispose();
    priceController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (selectedServiceIds.isEmpty || selectedZoneIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Select at least one service and one zone")),
      );
      return;
    }
    setState(() => isSaving = true);
    try {
      await ref.read(helperRepositoryProvider).updateProfile(
            bio: bioController.text.trim(),
            basePrice: double.tryParse(priceController.text.trim()) ?? 0,
            serviceIds: selectedServiceIds.toList(),
            zoneIds: selectedZoneIds.toList(),
          );
      if (!mounted) return;
      context.go("/helper/jobs");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    final zones = ref.watch(zonesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Helper Onboarding")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppTextField(controller: bioController, label: "Bio", maxLines: 3),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(
            controller: priceController,
            label: "Base price",
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: AppSpacing.sm),
          categories.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text("Could not load services"),
            data: (rows) => Wrap(
              spacing: AppSpacing.xs,
              children: rows
                  .map(
                    (c) => FilterChip(
                      label: Text(c.name),
                      selected: selectedServiceIds.contains(c.id),
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            selectedServiceIds.add(c.id);
                          } else {
                            selectedServiceIds.remove(c.id);
                          }
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          zones.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text("Could not load zones"),
            data: (rows) => Wrap(
              spacing: AppSpacing.xs,
              children: rows
                  .map(
                    (z) => FilterChip(
                      label: Text(z.name),
                      selected: selectedZoneIds.contains(z.id),
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            selectedZoneIds.add(z.id);
                          } else {
                            selectedZoneIds.remove(z.id);
                          }
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text("KYC upload and service area selection (MVP ready)."),
          const SizedBox(height: AppSpacing.md),
          AppButton(label: "Save Profile", isLoading: isSaving, onPressed: _save),
        ],
      ),
    );
  }
}
