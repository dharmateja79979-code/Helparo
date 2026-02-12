import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_router.dart';
import 'session.dart';
import '../core/theme/app_theme.dart';

class HelparoApp extends ConsumerStatefulWidget {
  const HelparoApp({super.key});

  @override
  ConsumerState<HelparoApp> createState() => _HelparoAppState();
}

class _HelparoAppState extends ConsumerState<HelparoApp> {
  final GlobalKey<ScaffoldMessengerState> _scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
  late final ProviderSubscription<SessionState> _sessionSub;

  @override
  void initState() {
    super.initState();
    _sessionSub = ref.listenManual<SessionState>(sessionProvider, (previous, next) {
      final wasLoggedIn = previous?.isLoggedIn ?? false;
      final isLoggedOutNow = !next.isLoggedIn;
      if (wasLoggedIn &&
          isLoggedOutNow &&
          next.logoutReason == LogoutReason.sessionExpired) {
        appRouter.go("/login");
        _scaffoldMessengerKey.currentState?.showSnackBar(
          const SnackBar(content: Text("Session expired. Please login again.")),
        );
      }
    });
  }

  @override
  void dispose() {
    _sessionSub.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Helparo',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      scaffoldMessengerKey: _scaffoldMessengerKey,
      routerConfig: appRouter,
    );
  }
}
