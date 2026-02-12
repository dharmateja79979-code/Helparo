import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/application/logout.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';

class HelperHomeScreen extends ConsumerWidget {
  const HelperHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Helparo - Helper"),
        actions: [
          IconButton(
            onPressed: () async {
              await performLogout(ref);
              if (!context.mounted) return;
              context.go("/login");
            },
            icon: const Icon(Icons.logout),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text("KYC & profile", style: TextStyle(fontSize: AppTypography.md, fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text("Set services, base price, zones, and upload KYC docs for approval."),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text("Jobs & Earnings", style: TextStyle(fontSize: AppTypography.md, fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text("Accept jobs, update status, send location pings, and review earnings summary."),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: "Complete Onboarding",
            onPressed: () => context.go("/helper/onboarding"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppButton(
            label: "View Jobs",
            onPressed: () => context.go("/helper/jobs"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppButton(
            label: "View Earnings",
            onPressed: () => context.go("/helper/earnings"),
          ),
        ],
      ),
    );
  }
}
