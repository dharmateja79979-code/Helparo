import '../../../core/network/api_client.dart';
import '../../../core/network/retry.dart';
import '../../booking/domain/booking.dart';

class HelperRepository {
  HelperRepository(this._api);

  final ApiClient _api;

  Future<List<Booking>> getMyJobs() async {
    final res = await _api.get("/helper/bookings");
    final envelope = res.data as Map<String, dynamic>;
    final rows = (envelope["data"] as List?) ?? [];
    return rows.map((e) {
      final row = (e as Map).cast<String, dynamic>();
      return Booking(
        id: (row["id"] ?? "").toString(),
        status: (row["status"] ?? "").toString(),
        categoryName: (row["category_id"] ?? "").toString(),
        createdAt: DateTime.tryParse((row["created_at"] ?? "").toString()) ?? DateTime.now(),
      );
    }).toList();
  }

  Future<void> acceptBooking(String bookingId) async {
    await _api.post("/bookings/$bookingId/accept");
  }

  Future<void> declineBooking(String bookingId) async {
    await _api.post("/bookings/$bookingId/decline");
  }

  Future<void> updateStatus({
    required String bookingId,
    required String status,
  }) async {
    await withRetry(() => _api.post("/bookings/$bookingId/status", data: {"status": status}));
  }

  Future<void> sendLocation({
    required String bookingId,
    required double lat,
    required double lng,
  }) async {
    await withRetry(() => _api.post("/helper/location", data: {
          "bookingId": bookingId,
          "lat": lat,
          "lng": lng,
          "timestamp": DateTime.now().toUtc().toIso8601String(),
        }));
  }

  Future<void> updateProfile({
    required String bio,
    required double basePrice,
    required List<String> serviceIds,
    required List<String> zoneIds,
  }) async {
    final data = <String, dynamic>{
      "bio": bio,
      "basePrice": basePrice,
    };
    if (serviceIds.isNotEmpty) data["services"] = serviceIds;
    if (zoneIds.isNotEmpty) data["serviceAreas"] = zoneIds;
    await _api.post("/helper/me", data: {
      ...data
    });
  }

  Future<Map<String, dynamic>> getEarnings() async {
    final res = await _api.get("/helper/earnings");
    final envelope = res.data as Map<String, dynamic>;
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }
}
