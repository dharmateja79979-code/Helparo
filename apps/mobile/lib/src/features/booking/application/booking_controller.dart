import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/booking_repository.dart';
import '../domain/booking.dart';
import '../domain/booking_timeline.dart';
import '../../../core/network/api_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final bookingRepositoryProvider =
    Provider<BookingRepository>((ref) => BookingRepository(ref.read(apiClientProvider)));

final myBookingsProvider = FutureProvider<List<Booking>>((ref) async {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.getMyBookings();
});

final bookingTimelineProvider =
    FutureProvider.family<BookingTimeline, String>((ref, bookingId) async {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.getTimeline(bookingId);
});

final bookingRealtimeProvider =
    StreamProvider.family<List<Map<String, dynamic>>, String>((ref, bookingId) {
  final client = Supabase.instance.client;
  final stream = client
      .from("booking_events")
      .stream(primaryKey: ["id"])
      .eq("booking_id", bookingId)
      .map((rows) => rows.cast<Map<String, dynamic>>());
  return stream;
});

final bookingMessagesRealtimeProvider =
    StreamProvider.family<List<Map<String, dynamic>>, String>((ref, bookingId) {
  final client = Supabase.instance.client;
  return client
      .from("messages")
      .stream(primaryKey: ["id"])
      .eq("booking_id", bookingId)
      .map((rows) => rows.cast<Map<String, dynamic>>());
});

final bookingMediaUrlProvider =
    FutureProvider.family<String, ({String bookingId, String mediaId})>((ref, key) async {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.getMediaSignedUrl(bookingId: key.bookingId, mediaId: key.mediaId);
});
