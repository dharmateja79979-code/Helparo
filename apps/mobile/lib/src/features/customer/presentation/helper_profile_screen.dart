import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';

class HelperProfileScreen extends StatelessWidget {
  const HelperProfileScreen({
    super.key,
    required this.helperId,
    required this.categoryId,
    required this.categoryName,
  });

  final String helperId;
  final String categoryId;
  final String categoryName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Helper Profile")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Verified helper", style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text("KYC approved, high reliability score, low cancellation history."),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: "Book Now",
            onPressed: () => context.go(
              "/customer/booking/create?helperId=$helperId&categoryId=$categoryId&categoryName=$categoryName",
            ),
          )
        ],
      ),
    );
  }
}
