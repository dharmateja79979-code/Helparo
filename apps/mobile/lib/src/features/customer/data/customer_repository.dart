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

  Future<Map<String, dynamic>> raiseDispute({
    required String bookingId,
    required String reason,
    List<String>? evidence,
  }) async {
    final res = await _api.post(
      "/bookings/$bookingId/dispute",
      data: {
        "reason": reason,
        if (evidence != null && evidence.isNotEmpty) "evidence": evidence,
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>?> getMyPremium() async {
    final res = await _api.get("/premium/me");
    final envelope = (res.data as Map).cast<String, dynamic>();
    final data = envelope["data"];
    if (data is Map) return data.cast<String, dynamic>();
    return null;
  }

  Future<Map<String, dynamic>> subscribePremium({
    required String planCode,
    String? providerRef,
  }) async {
    final res = await _api.post(
      "/premium/subscribe",
      data: {
        "planCode": planCode,
        if (providerRef != null && providerRef.trim().isNotEmpty)
          "providerRef": providerRef.trim(),
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> cancelPremium({String? reason}) async {
    final res = await _api.post(
      "/premium/cancel",
      data: {
        if (reason != null && reason.trim().isNotEmpty) "reason": reason.trim(),
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> createCorporateAccount({
    required String name,
    String? city,
  }) async {
    final res = await _api.post(
      "/corporate/accounts",
      data: {
        "name": name,
        if (city != null && city.trim().isNotEmpty) "city": city.trim(),
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> createCorporateBooking({
    required String corporateId,
    required String bookingId,
    String? costCenter,
  }) async {
    final res = await _api.post(
      "/corporate/bookings",
      data: {
        "corporateId": corporateId,
        "bookingId": bookingId,
        if (costCenter != null && costCenter.trim().isNotEmpty)
          "costCenter": costCenter.trim(),
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<List<Map<String, dynamic>>> listCorporateBookings() async {
    final res = await _api.get("/corporate/bookings");
    final envelope = (res.data as Map).cast<String, dynamic>();
    final rows = (envelope["data"] as List?) ?? [];
    return rows.map((e) => (e as Map).cast<String, dynamic>()).toList();
  }

  Future<List<Map<String, dynamic>>> listCorporateMembers({
    required String corporateId,
  }) async {
    final res = await _api.get("/corporate/accounts/$corporateId/members");
    final envelope = (res.data as Map).cast<String, dynamic>();
    final rows = (envelope["data"] as List?) ?? [];
    return rows.map((e) => (e as Map).cast<String, dynamic>()).toList();
  }

  Future<Map<String, dynamic>> addCorporateMember({
    required String corporateId,
    required String userId,
    required String role,
  }) async {
    final res = await _api.post(
      "/corporate/accounts/$corporateId/members",
      data: {"userId": userId, "role": role},
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> createAiEstimate({
    String? bookingId,
    required List<String> inputMedia,
    String? prompt,
  }) async {
    final res = await _api.post(
      "/ai/estimate",
      data: {
        if (bookingId != null && bookingId.trim().isNotEmpty) "bookingId": bookingId.trim(),
        "inputMedia": inputMedia,
        if (prompt != null && prompt.trim().isNotEmpty) "prompt": prompt.trim(),
      },
    );
    final envelope = (res.data as Map).cast<String, dynamic>();
    return ((envelope["data"] as Map?) ?? <String, dynamic>{}).cast<String, dynamic>();
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
