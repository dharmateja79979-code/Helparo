class HelperProfileSummary {
  HelperProfileSummary({
    required this.id,
    required this.rating,
    required this.reliabilityScore,
    required this.basePrice,
  });

  final String id;
  final double rating;
  final int reliabilityScore;
  final double basePrice;

  factory HelperProfileSummary.fromJson(Map<String, dynamic> json) {
    return HelperProfileSummary(
      id: (json["id"] ?? "").toString(),
      rating: (json["ratingAvg"] as num?)?.toDouble() ?? (json["rating_avg"] as num?)?.toDouble() ?? 0,
      reliabilityScore: (json["reliabilityScore"] as num?)?.toInt() ?? (json["reliability_score"] as num?)?.toInt() ?? 0,
      basePrice: (json["basePrice"] as num?)?.toDouble() ?? (json["base_price"] as num?)?.toDouble() ?? 0,
    );
  }
}
