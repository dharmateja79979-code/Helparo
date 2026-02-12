import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/session.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await ref.read(sessionProvider.notifier).initialize();
    await Future<void>.delayed(const Duration(milliseconds: 250));
    if (!mounted) return;
    final session = ref.read(sessionProvider);
    if (!session.isLoggedIn) {
      context.go("/login");
      return;
    }
    context.go(session.role == AppRole.customer ? "/customer" : "/helper");
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
