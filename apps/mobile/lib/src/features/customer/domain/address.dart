class AddressItem {
  AddressItem({
    required this.id,
    required this.label,
    required this.line1,
  });

  final String id;
  final String label;
  final String line1;

  factory AddressItem.fromJson(Map<String, dynamic> json) {
    return AddressItem(
      id: (json["id"] ?? "").toString(),
      label: (json["label"] ?? "").toString(),
      line1: (json["line1"] ?? "").toString(),
    );
  }
}
