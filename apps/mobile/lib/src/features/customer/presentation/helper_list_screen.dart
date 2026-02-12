import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../application/customer_controller.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_card.dart';

class HelperListScreen extends ConsumerWidget {
  const HelperListScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
  });

  final String categoryId;
  final String categoryName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final helpers = ref.watch(helpersProvider(categoryId));
    return Scaffold(
      appBar: AppBar(title: Text("$categoryName Helpers")),
      body: helpers.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text("Failed to load helpers")),
        data: (items) => ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final h = items[index];
            return AppCard(
              onTap: () => context.go(
                "/customer/helper/${h.id}?categoryId=$categoryId&categoryName=$categoryName",
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Helper ${h.id.substring(0, h.id.length > 8 ? 8 : h.id.length)}",
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: AppSpacing.xs),
                  Text("Rating ${h.rating.toStringAsFixed(1)}  Reliability ${h.reliabilityScore}  Base ${h.basePrice.toStringAsFixed(0)}"),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
