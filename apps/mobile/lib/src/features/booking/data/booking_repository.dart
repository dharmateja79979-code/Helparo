import '../domain/booking.dart';
import '../domain/booking_timeline.dart';
import '../../../core/network/api_client.dart';

class _CachedMediaUrl {
  _CachedMediaUrl({required this.url, required this.expiresAt});

  final String url;
  final DateTime expiresAt;
}

class BookingRepository {
  BookingRepository(this._api);

  final ApiClient _api;
  final Map<String, _CachedMediaUrl> _mediaUrlCache = {};

  void clearMediaCacheForBooking(String bookingId) {
    final prefix = "$bookingId:";
    _mediaUrlCache.removeWhere((key, _) => key.startsWith(prefix));
  }

  void clearAllMediaCache() {
    _mediaUrlCache.clear();
  }

  Future<List<Booking>> getMyBookings() async {
    final response = await _api.get("/bookings");
    final envelope = response.data as Map<String, dynamic>;
    final data = (envelope["data"] as List?) ?? [];
    return data.map((item) {
      final row = item as Map<String, dynamic>;
      return Booking(
        id: (row["id"] ?? "").toString(),
        status: (row["status"] ?? "").toString(),
        categoryName: (row["category_id"] ?? "").toString(),
        createdAt: DateTime.tryParse((row["created_at"] ?? "").toString()) ?? DateTime.now(),
      );
    }).toList();
  }

  Future<BookingTimeline> getTimeline(String bookingId) async {
    final response = await _api.get("/bookings/$bookingId/timeline");
    final envelope = response.data as Map<String, dynamic>;
    final data = (envelope["data"] ?? <String, dynamic>{}) as Map<String, dynamic>;
    return BookingTimeline.fromJson(data);
  }

  Future<String> getMediaSignedUrl({
    required String bookingId,
    required String mediaId,
  }) async {
    final key = "$bookingId:$mediaId";
    final now = DateTime.now();
    final cached = _mediaUrlCache[key];
    if (cached != null && cached.expiresAt.isAfter(now)) {
      return cached.url;
    }

    final response = await _api.get("/bookings/$bookingId/media/$mediaId/url");
    final envelope = response.data as Map<String, dynamic>;
    final data = ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
    final url = (data["signedUrl"] ?? "").toString();
    final expiresInSec = (data["expiresInSec"] as num?)?.toInt() ?? 1800;
    if (url.isNotEmpty) {
      // Keep a small safety margin before storage URL expiry.
      final expiry = now.add(Duration(seconds: expiresInSec - 60));
      _mediaUrlCache[key] = _CachedMediaUrl(url: url, expiresAt: expiry);
    }
    return url;
  }
}
