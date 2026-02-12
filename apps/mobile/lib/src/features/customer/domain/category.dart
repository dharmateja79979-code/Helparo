class Category {
  Category({required this.id, required this.name, this.description});

  final String id;
  final String name;
  final String? description;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: (json["id"] ?? "").toString(),
      name: (json["name"] ?? "").toString(),
      description: json["description"]?.toString(),
    );
  }
}
