import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../application/helper_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_card.dart';

class HelperEarningsScreen extends ConsumerWidget {
  const HelperEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final earnings = ref.watch(helperEarningsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Earnings")),
      body: earnings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text("Failed to load earnings")),
        data: (data) => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            AppCard(child: Text("This week: INR ${(data["week"] ?? 0).toString()}")),
            const SizedBox(height: AppSpacing.sm),
            AppCard(child: Text("This month: INR ${(data["month"] ?? 0).toString()}")),
            const SizedBox(height: AppSpacing.sm),
            AppCard(child: Text("Completed jobs: ${(data["totalJobs"] ?? 0).toString()}")),
            const SizedBox(height: AppSpacing.sm),
            const AppCard(child: Text("Commission applied: 15% (admin configurable)")),
          ],
        ),
      ),
    );
  }
}
