import 'package:flutter/material.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int rating = 5;
  final commentController = TextEditingController();

  @override
  void dispose() {
    commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Review")),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text("Booking ${widget.bookingId}"),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<int>(
            initialValue: rating,
            items: [1, 2, 3, 4, 5]
                .map((r) =>
                    DropdownMenuItem<int>(value: r, child: Text("$r stars")))
                .toList(),
            onChanged: (v) => setState(() => rating = v ?? 5),
            decoration: const InputDecoration(
                labelText: "Rating", border: OutlineInputBorder()),
          ),
          const SizedBox(height: AppSpacing.md),
          AppTextField(
              controller: commentController, label: "Comment", maxLines: 3),
          const SizedBox(height: AppSpacing.lg),
          const AppButton(label: "Submit Review", onPressed: null)
        ],
      ),
    );
  }
}
