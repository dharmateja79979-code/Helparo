class Zone {
  Zone({
    required this.id,
    required this.name,
    required this.city,
    required this.country,
  });

  final String id;
  final String name;
  final String city;
  final String country;

  factory Zone.fromJson(Map<String, dynamic> json) {
    return Zone(
      id: (json["id"] ?? "").toString(),
      name: (json["name"] ?? "").toString(),
      city: (json["city"] ?? "").toString(),
      country: (json["country"] ?? "").toString(),
    );
  }
}
