import '../../../core/network/api_client.dart';
import '../../../core/network/retry.dart';
import 'package:dio/dio.dart';
import '../domain/address.dart';
import '../domain/category.dart';
import '../domain/helper_profile.dart';
import '../domain/zone.dart';

class CustomerRepository {
  CustomerRepository(this._api);

  final ApiClient _api;

  Future<List<Category>> getCategories() async {
    final res = await _api.get("/categories");
    final envelope = res.data as Map<String, dynamic>;
    final rows = (envelope["data"] as List?) ?? [];
    return rows
        .map((e) => Category.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<HelperProfileSummary>> getHelpers({required String categoryId}) async {
    final res = await _api.get("/helpers", query: {"categoryId": categoryId});
    final envelope = res.data as Map<String, dynamic>;
    final rows = (envelope["data"] as List?) ?? [];
    return rows
        .map((e) => HelperProfileSummary.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<Zone>> getZones() async {
    final res = await _api.get("/zones");
    final envelope = res.data as Map<String, dynamic>;
    final rows = (envelope["data"] as List?) ?? [];
    return rows
        .map((e) => Zone.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<AddressItem>> getAddresses() async {
    final res = await _api.get("/addresses");
    final envelope = res.data as Map<String, dynamic>;
    final rows = (envelope["data"] as List?) ?? [];
    return rows
        .map((e) => AddressItem.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<AddressItem> createAddress({
    required String label,
    required String line1,
  }) async {
    final res = await _api.post(
      "/addresses",
      data: {"label": label, "line1": line1},
    );
    final envelope = res.data as Map<String, dynamic>;
    return AddressItem.fromJson((envelope["data"] as Map).cast<String, dynamic>());
  }

  Future<String> createBooking({
    required String categoryId,
    required String addressId,
    String? notes,
    DateTime? scheduledAt,
  }) async {
    final res = await _api.post(
      "/bookings",
      data: {
        "categoryId": categoryId,
        "addressId": addressId,
        if (notes != null && notes.trim().isNotEmpty) "notes": notes.trim(),
        if (scheduledAt != null) "scheduledAt": scheduledAt.toUtc().toIso8601String(),
      },
    );
    final envelope = res.data as Map<String, dynamic>;
    final data = (envelope["data"] as Map).cast<String, dynamic>();
    return (data["id"] ?? "").toString();
  }

  Future<void> sendMessage({
    required String bookingId,
    required String body,
  }) async {
    await withRetry(() => _api.post("/bookings/$bookingId/message", data: {"body": body}));
  }

  Future<void> recordPayment({
    required String bookingId,
    required String method,
    required double amount,
  }) async {
    await withRetry(
      () => _api.post(
        "/bookings/$bookingId/payment",
        data: {"method": method, "amount": amount},
      ),
    );
  }

  Future<void> submitReview({
    required String bookingId,
    required int rating,
    String? comment,
  }) async {
    await _api.post(
      "/bookings/$bookingId/review",
      data: {
        "rating": rating,
        if (comment != null && comment.trim().isNotEmpty) "comment": comment.trim(),
      },
    );
  }

  Future<void> cancelBooking(String bookingId) async {
    await _api.post("/bookings/$bookingId/cancel");
  }

  Future<void> uploadBookingMedia({
    required String bookingId,
    required List<int> bytes,
    required String fileName,
    required String contentType,
    String type = "issue",
  }) async {
    final res = await _api.post(
      "/bookings/$bookingId/media",
      data: {
        "type": type,
        "fileName": fileName,
        "contentType": contentType
      },
    );
    final envelope = res.data as Map<String, dynamic>;
    final data = ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
    final signedUrl = (data["signedUrl"] ?? "").toString();
    if (signedUrl.isEmpty) return;

    final dio = Dio();
    await dio.put(
      signedUrl,
      data: bytes,
      options: Options(headers: {"content-type": contentType}),
    );
  }
}
