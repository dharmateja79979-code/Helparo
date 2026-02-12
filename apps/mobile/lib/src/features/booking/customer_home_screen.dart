import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/application/logout.dart';
import 'application/booking_controller.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_chip.dart';

class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(myBookingsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Helparo - Customer"),
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
          const Text("Bangalore + India-ready service model", style: TextStyle(fontSize: AppTypography.lg)),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            children: const [
              AppChip(label: "Cleaning", selected: true),
              AppChip(label: "Plumbing"),
              AppChip(label: "Electrical"),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text("Quick Booking", style: TextStyle(fontSize: AppTypography.md, fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text("Create booking, track status, chat, upload media, and mark payment (Cash/UPI)."),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          bookings.when(
            data: (items) => Text("Cached bookings: ${items.length}"),
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text("Could not load cached bookings"),
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: "Start Booking",
            onPressed: () => context.go("/customer/location"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppButton(
            label: "Profile & Addresses",
            onPressed: () => context.go("/customer/profile"),
          ),
          const SizedBox(height: AppSpacing.sm),
          AppButton(
            label: "Advanced Features",
            onPressed: () => context.go("/customer/features"),
          ),
        ],
      ),
    );
  }
}
