import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_chip.dart';

class AdvancedFeaturesScreen extends StatelessWidget {
  const AdvancedFeaturesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Advanced Features")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(
            child: Text("Phase 2 capabilities, each in a focused flow."),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.xs,
            children: const [
              AppChip(label: "Dispute", selected: true),
              AppChip(label: "Premium"),
              AppChip(label: "Corporate"),
              AppChip(label: "AI Estimate")
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: "Go to Dispute",
            onPressed: () => context.go("/customer/features/dispute"),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Go to Premium",
            onPressed: () => context.go("/customer/features/premium"),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Go to Corporate",
            onPressed: () => context.go("/customer/features/corporate"),
          ),
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            label: "Go to AI Estimate",
            onPressed: () => context.go("/customer/features/ai-estimate"),
          ),
        ],
      ),
    );
  }
}
