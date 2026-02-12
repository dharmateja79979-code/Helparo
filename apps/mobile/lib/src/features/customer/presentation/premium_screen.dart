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

class PremiumScreen extends ConsumerStatefulWidget {
  const PremiumScreen({super.key});

  @override
  ConsumerState<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends ConsumerState<PremiumScreen> {
  final planController = TextEditingController(text: "premium_monthly");
  bool isBusy = false;
  Map<String, dynamic>? premiumInfo;

  @override
  void dispose() {
    planController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action, {String? successMessage}) async {
    setState(() => isBusy = true);
    try {
      await action();
      if (!mounted) return;
      if (successMessage != null) showAppToast(context, successMessage);
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
      appBar: AppBar(title: const Text("Premium")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(child: Text("Manage premium subscription.")),
          const SizedBox(height: AppSpacing.md),
          AppTextField(controller: planController, label: "Plan code"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Subscribe",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              await repo.subscribePremium(planCode: planController.text.trim());
            }, successMessage: "Subscribed"),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Cancel Premium",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              await repo.cancelPremium(reason: "user_requested");
            }, successMessage: "Subscription cancelled"),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Refresh My Plan",
            isLoading: isBusy,
            onPressed: () => _run(() async {
              final data = await repo.getMyPremium();
              if (!mounted) return;
              setState(() => premiumInfo = data);
            }),
          ),
          if (premiumInfo != null) ...[
            const SizedBox(height: AppSpacing.sm),
            AppCard(child: Text(jsonEncode(premiumInfo))),
          ]
        ],
      ),
    );
  }
}
