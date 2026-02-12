class Booking {
  Booking({
    required this.id,
    required this.status,
    required this.categoryName,
    required this.createdAt,
  });

  final String id;
  final String status;
  final String categoryName;
  final DateTime createdAt;
}
