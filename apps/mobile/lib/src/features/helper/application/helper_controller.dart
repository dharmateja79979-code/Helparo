import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/network/api_client.dart';
import '../../booking/domain/booking.dart';
import '../data/helper_repository.dart';

final helperRepositoryProvider =
    Provider<HelperRepository>((ref) => HelperRepository(ref.read(apiClientProvider)));

final helperJobsProvider = FutureProvider<List<Booking>>((ref) async {
  return ref.watch(helperRepositoryProvider).getMyJobs();
});

final helperEarningsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(helperRepositoryProvider).getEarnings();
});

final helperJobsRealtimeProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  final client = Supabase.instance.client;
  final userId = client.auth.currentUser?.id;
  if (userId == null || userId.isEmpty) {
    return Stream.value(const <Map<String, dynamic>>[]);
  }
  return client
      .from("bookings")
      .stream(primaryKey: ["id"])
      .eq("helper_id", userId)
      .map((rows) => rows.cast<Map<String, dynamic>>());
});
