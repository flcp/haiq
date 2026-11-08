// The model's comment / clarification. Borderless — sits on the background,
// below the document and above the prompt.
export default function CommentField({ comment }) {
  if (!comment) return null
  return (
    <div className="comment-field">
      <span className="comment-tag">assistant</span>
      <span className="comment-text">{comment}</span>
    </div>
  )
}
