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

class AiEstimateScreen extends ConsumerStatefulWidget {
  const AiEstimateScreen({super.key});

  @override
  ConsumerState<AiEstimateScreen> createState() => _AiEstimateScreenState();
}

class _AiEstimateScreenState extends ConsumerState<AiEstimateScreen> {
  final bookingIdController = TextEditingController();
  final mediaController = TextEditingController(text: "https://example.com/photo.jpg");
  final promptController = TextEditingController();
  bool isBusy = false;
  Map<String, dynamic>? estimate;

  @override
  void dispose() {
    bookingIdController.dispose();
    mediaController.dispose();
    promptController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    setState(() => isBusy = true);
    try {
      final media = mediaController.text
          .split(",")
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
      final data = await ref.read(customerRepositoryProvider).createAiEstimate(
            bookingId: bookingIdController.text.trim(),
            inputMedia: media,
            prompt: promptController.text.trim(),
          );
      if (!mounted) return;
      setState(() => estimate = data);
      showAppToast(context, "Estimate created");
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, parseApiError(e));
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI Estimate")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const AppCard(
            child: Text("Photo-based estimate stub (Phase 2 foundation)."),
          ),
          const SizedBox(height: AppSpacing.md),
          AppTextField(controller: bookingIdController, label: "Booking ID (optional)"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(
              controller: mediaController,
              label: "Image URLs (comma-separated)"),
          const SizedBox(height: AppSpacing.xs),
          AppTextField(controller: promptController, label: "Prompt"),
          const SizedBox(height: AppSpacing.xs),
          AppButton(label: "Create Estimate", isLoading: isBusy, onPressed: _create),
          if (estimate != null) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(child: Text(jsonEncode(estimate))),
          ]
        ],
      ),
    );
  }
}
