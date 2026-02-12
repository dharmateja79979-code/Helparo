import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/session.dart';
import '../../booking/application/booking_controller.dart';

Future<void> performLogout(WidgetRef ref) async {
  try {
    await Supabase.instance.client.auth.signOut();
  } catch (_) {}
  try {
    await FirebaseAuth.instance.signOut();
  } catch (_) {}
  ref.read(bookingRepositoryProvider).clearAllMediaCache();
  ref.read(sessionProvider.notifier).logout();
}
