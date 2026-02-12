import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'session_storage.dart';

enum AppRole { customer, helper }
enum OtpMode { phoneFirebase, emailSupabase }
enum LogoutReason { manual, sessionExpired }

class SessionState {
  const SessionState({
    this.isLoggedIn = false,
    this.role = AppRole.customer,
    this.otpMode = OtpMode.phoneFirebase,
    this.appAccessToken,
    this.logoutReason,
  });

  final bool isLoggedIn;
  final AppRole role;
  final OtpMode otpMode;
  final String? appAccessToken;
  final LogoutReason? logoutReason;

  SessionState copyWith({
    bool? isLoggedIn,
    AppRole? role,
    OtpMode? otpMode,
    String? appAccessToken,
    LogoutReason? logoutReason,
  }) {
    return SessionState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      role: role ?? this.role,
      otpMode: otpMode ?? this.otpMode,
      appAccessToken: appAccessToken ?? this.appAccessToken,
      logoutReason: logoutReason ?? this.logoutReason,
    );
  }
}

class SessionNotifier extends StateNotifier<SessionState> {
  SessionNotifier() : super(const SessionState());

  Future<void> initialize() async {
    final saved = await SessionStorage.load();
    if (saved != null) {
      state = saved;
    }
  }

  void setRole(AppRole role) {
    state = state.copyWith(role: role);
    SessionStorage.save(state);
  }

  void setOtpMode(OtpMode otpMode) {
    state = state.copyWith(otpMode: otpMode);
    SessionStorage.save(state);
  }

  void loginSuccess({String? appAccessToken}) {
    state = state.copyWith(
      isLoggedIn: true,
      appAccessToken: appAccessToken,
      logoutReason: null,
    );
    SessionStorage.save(state);
  }

  void logout({LogoutReason reason = LogoutReason.manual}) {
    state = SessionState(logoutReason: reason);
    SessionStorage.clear();
  }
}

final sessionProvider = StateNotifierProvider<SessionNotifier, SessionState>(
  (ref) => SessionNotifier(),
);
