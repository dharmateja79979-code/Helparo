import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/session.dart';
import 'application/auth_controller.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_text_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController otpController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  bool otpSent = false;

  @override
  void dispose() {
    phoneController.dispose();
    emailController.dispose();
    otpController.dispose();
    nameController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp(SessionState session) async {
    final auth = ref.read(authControllerProvider.notifier);
    if (session.otpMode == OtpMode.phoneFirebase) {
      await auth.sendPhoneOtp(phoneController.text.trim());
    } else {
      await auth.sendEmailOtp(emailController.text.trim());
    }
    if (mounted) setState(() => otpSent = true);
  }

  Future<void> _verifyOtp(SessionState session) async {
    final auth = ref.read(authControllerProvider.notifier);
    if (session.otpMode == OtpMode.phoneFirebase) {
      await auth.verifyPhoneOtp(
        smsCode: otpController.text.trim(),
        role: session.role,
        name: nameController.text.trim(),
      );
    } else {
      await auth.verifyEmailOtp(
        email: emailController.text.trim(),
        token: otpController.text.trim(),
        role: session.role,
        name: nameController.text.trim(),
      );
    }
    final state = ref.read(authControllerProvider);
    if (state.hasError || !mounted) return;
    context.go(session.role == AppRole.customer ? "/customer" : "/helper");
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text("Helparo Login")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          const Text("Choose OTP method", style: TextStyle(fontSize: AppTypography.lg)),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            children: [
              ChoiceChip(
                label: const Text("Phone OTP (Firebase)"),
                selected: session.otpMode == OtpMode.phoneFirebase,
                onSelected: (_) => ref.read(sessionProvider.notifier).setOtpMode(OtpMode.phoneFirebase),
              ),
              ChoiceChip(
                label: const Text("Email OTP (Supabase)"),
                selected: session.otpMode == OtpMode.emailSupabase,
                onSelected: (_) => ref.read(sessionProvider.notifier).setOtpMode(OtpMode.emailSupabase),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            child: Column(
              children: [
                AppTextField(controller: nameController, label: "Name"),
                const SizedBox(height: AppSpacing.sm),
                if (session.otpMode == OtpMode.phoneFirebase)
                  AppTextField(controller: phoneController, label: "Phone number", keyboardType: TextInputType.phone)
                else
                  AppTextField(controller: emailController, label: "Email", keyboardType: TextInputType.emailAddress),
                const SizedBox(height: AppSpacing.sm),
                if (otpSent) AppTextField(controller: otpController, label: "OTP code", keyboardType: TextInputType.number),
                const SizedBox(height: AppSpacing.md),
                SegmentedButton<AppRole>(
                  segments: const [
                    ButtonSegment(value: AppRole.customer, label: Text("Customer")),
                    ButtonSegment(value: AppRole.helper, label: Text("Helper")),
                  ],
                  selected: {session.role},
                  onSelectionChanged: (value) {
                    ref.read(sessionProvider.notifier).setRole(value.first);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (!otpSent)
            AppButton(
              label: "Send OTP",
              isLoading: isLoading,
              onPressed: () => _sendOtp(session),
            )
          else
            AppButton(
              label: "Verify OTP",
              isLoading: isLoading,
              onPressed: () => _verifyOtp(session),
            ),
          if (authState.hasError) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              authState.error.toString(),
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ]
        ],
      ),
    );
  }
}
