import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../application/customer_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';

class LocationZoneScreen extends ConsumerWidget {
  const LocationZoneScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const mapPrimary = String.fromEnvironment("MAP_PROVIDER_PRIMARY", defaultValue: "google");
    const mapFallback = String.fromEnvironment("MAP_PROVIDER_FALLBACK", defaultValue: "osm");
    final zones = ref.watch(zonesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Choose Location")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text("Service coverage", style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text("Start in Bangalore, scale-ready for all India zones."),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            child: Text("Maps: primary=$mapPrimary, fallback=$mapFallback"),
          ),
          const SizedBox(height: AppSpacing.md),
          zones.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text("Could not load zones"),
            data: (rows) => Wrap(
              spacing: AppSpacing.xs,
              children: rows.map((z) => Chip(label: Text("${z.name}, ${z.city}"))).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: "Continue to Categories",
            onPressed: () => context.go("/customer/categories"),
          )
        ],
      ),
    );
  }
}
