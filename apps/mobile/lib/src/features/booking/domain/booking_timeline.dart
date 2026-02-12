class BookingTimeline {
  BookingTimeline({
    required this.events,
    required this.messages,
    required this.media,
    required this.payments,
  });

  final List<Map<String, dynamic>> events;
  final List<Map<String, dynamic>> messages;
  final List<Map<String, dynamic>> media;
  final List<Map<String, dynamic>> payments;

  factory BookingTimeline.fromJson(Map<String, dynamic> json) {
    return BookingTimeline(
      events: ((json["events"] as List?) ?? []).cast<Map<String, dynamic>>(),
      messages: ((json["messages"] as List?) ?? []).cast<Map<String, dynamic>>(),
      media: ((json["media"] as List?) ?? []).cast<Map<String, dynamic>>(),
      payments: ((json["payments"] as List?) ?? []).cast<Map<String, dynamic>>(),
    );
  }
}
