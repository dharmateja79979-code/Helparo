import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../application/helper_controller.dart';
import '../../../core/theme/status_theme.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';

class HelperJobsScreen extends ConsumerStatefulWidget {
  const HelperJobsScreen({super.key});

  @override
  ConsumerState<HelperJobsScreen> createState() => _HelperJobsScreenState();
}

class _HelperJobsScreenState extends ConsumerState<HelperJobsScreen> {
  String tab = "requested";
  Timer? pollTimer;

  @override
  void initState() {
    super.initState();
    pollTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      ref.invalidate(helperJobsProvider);
    });
  }

  @override
  void dispose() {
    pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final jobs = ref.watch(helperJobsProvider);
    final realtime = ref.watch(helperJobsRealtimeProvider);
    ref.listen(helperJobsRealtimeProvider, (_, next) {
      next.whenData((rows) {
        if (rows.isNotEmpty) {
          ref.invalidate(helperJobsProvider);
        }
      });
    });
    return Scaffold(
      appBar: AppBar(title: const Text("Job Requests")),
      body: jobs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text("Failed to load jobs")),
        data: (rows) {
          final requested = rows.where((r) => r.status == "requested").toList();
          final active = rows
              .where((r) => r.status == "accepted" || r.status == "enroute" || r.status == "started")
              .toList();
          final done = rows
              .where((r) => r.status == "completed" || r.status == "paid" || r.status == "cancelled")
              .toList();
          final filtered = tab == "requested"
              ? requested
              : tab == "active"
                  ? active
                  : done;

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(helperJobsProvider),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                Wrap(
                  spacing: AppSpacing.xs,
                  children: [
                    ChoiceChip(
                      label: Text("Requested (${requested.length})"),
                      selected: tab == "requested",
                      onSelected: (_) => setState(() => tab = "requested"),
                    ),
                    ChoiceChip(
                      label: Text("Active (${active.length})"),
                      selected: tab == "active",
                      onSelected: (_) => setState(() => tab = "active"),
                    ),
                    ChoiceChip(
                      label: Text("Done (${done.length})"),
                      selected: tab == "done",
                      onSelected: (_) => setState(() => tab = "done"),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                AppButton(
                  label: "Refresh Now",
                  onPressed: () => ref.invalidate(helperJobsProvider),
                ),
                const SizedBox(height: AppSpacing.sm),
                realtime.when(
                  data: (_) => _connectionChip("Jobs Live", true),
                  loading: () => _connectionChip("Jobs Connecting", false),
                  error: (_, __) => _connectionChip("Jobs Offline", false),
                ),
                const SizedBox(height: AppSpacing.sm),
                ...filtered.map(
                  (job) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: AppCard(
                      onTap: () => context.go("/helper/job/${job.id}"),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Booking ${job.id}", style: const TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: AppSpacing.xs),
                          Wrap(
                            spacing: AppSpacing.xs,
                            children: [
                              Text("Status: ${job.status}"),
                              Chip(
                                label: Text(job.status),
                                backgroundColor:
                                    statusColor(job.status, Theme.of(context).colorScheme).withValues(alpha: 0.15),
                                side: BorderSide(
                                  color: statusColor(job.status, Theme.of(context).colorScheme),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text("Created: ${_formatTs(job.createdAt)}"),
                        ],
                      ),
                    ),
                  ),
                ),
                if (filtered.isEmpty) const AppCard(child: Text("No jobs in this tab")),
              ],
            ),
          );
        },
      ),
    );
  }
}

String _formatTs(DateTime dt) {
  final local = dt.toLocal();
  String two(int n) => n < 10 ? "0$n" : "$n";
  return "${local.year}-${two(local.month)}-${two(local.day)} ${two(local.hour)}:${two(local.minute)}";
}

Widget _connectionChip(String label, bool live) {
  return Chip(
    label: Text(label),
    avatar: Icon(
      Icons.circle,
      size: 10,
      color: live ? Colors.green : Colors.orange,
    ),
  );
}
