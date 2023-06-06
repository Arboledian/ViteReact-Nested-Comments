import { useState } from "react";
import { usePost } from "../context/PostContext";
import { CommentList } from "./CommentList";
import { IconBtn } from "./IconBtn";
import { FaEdit, FaHeart, FaRegHeart, FaReply, FaTrash } from "react-icons/fa";
import { CommentForm } from "./CommentForm";
import { useAsyncFn } from "../hooks/useAsync";
import {
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../services/comments";
import { useUser } from "../hooks/useUser";
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function Comment({
  id,
  message,
  user,
  createdAt,
  likeCount,
  likedByMe,
}) {
  const [areChildrenHidden, setAreChildrenHidden] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const {
    post,
    getReplies,
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    toggleLocalCommentLike,
  } = usePost();
  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);
  const currentUser = useUser();

  function onCommentReply(message) {
    return createCommentFn
      .execute({ postId: post.id, message, parentId: id })
      .then(comment => {
        setIsReplying(false);
        createLocalComment(comment);
      });
  }
  function onCommentUpdate(message) {
    return updateCommentFn
      .execute({ postId: post.id, message, id })
      .then(comment => {
        setIsEditing(false);
        updateLocalComment(id, comment.message);
      });
  }

  function onCommentDelete() {
    return deleteCommentFn
      .execute({ postId: post.id, id })
      .then(comment => deleteLocalComment(comment.id));
  }

  function onToggleCommentLike() {
    return toggleCommentLikeFn
      .execute({
        id,
        postId: post.id,
      })
      .then(({ addLike }) => toggleLocalCommentLike(id, addLike));
  }

  return (
    <>
      <div className="comment">
        <div className="header">
          <span className="name">{user.name}</span>
          <span className="date">
            {dateFormatter.format(Date.parse(createdAt))}
          </span>
        </div>
        {isEditing ? (
          <CommentForm
            autoFocus
            initialValue={message}
            onSubmit={onCommentUpdate}
            loading={updateCommentFn.loading}
            error={updateCommentFn.error}
          />
        ) : (
          <div className="message">{message}</div>
        )}

        <div className="footer">
          <IconBtn
            Icon={likedByMe ? FaHeart : FaRegHeart}
            disabled={toggleCommentLikeFn.loading}
            onClick={onToggleCommentLike}
            aria-label={likedByMe ? "Unlike" : "Like"}
          >
            {likeCount}
          </IconBtn>
          <IconBtn
            Icon={FaReply}
            onClick={() => setIsReplying(prev => !prev)}
            isActive={isReplying}
            aria-label={isReplying ? "Cancel Reply" : "Reply"}
          />

          {user.id === currentUser.id && (
            <>
              <IconBtn
                Icon={FaEdit}
                onClick={() => setIsEditing(prev => !prev)}
                isActive={isEditing}
                aria-label={isEditing ? "Cancel Edit" : "Edit"}
              />

              <IconBtn
                Icon={FaTrash}
                disabled={deleteCommentFn.loading}
                onClick={onCommentDelete}
                aria-label="Delete"
                color="danger"
              />
            </>
          )}
          <div>
            {deleteCommentFn.error && (
              <div className="error-msg mt-1">{deleteCommentFn.error}</div>
            )}
          </div>
        </div>
      </div>
      {isReplying && (
        <div className="mt-1 m1-3">
          <CommentForm
            autoFocus
            onSubmit={onCommentReply}
            loading={createCommentFn.loading}
            error={createCommentFn.error}
          />
        </div>
      )}
      {childComments?.length > 0 && (
        <>
          <div
            className={`nested-comments-stack ${
              areChildrenHidden ? "hide" : ""
            }`}
          >
            <button
              className="collapse-line"
              aria-label="Hide-Replies"
              onClick={() => setAreChildrenHidden(true)}
            />
            <div className="nested-comments">
              <CommentList comments={childComments} />
            </div>
          </div>
          <button
            className={`btn mt-1 ${!areChildrenHidden ? "hide" : ""}`}
            onClick={() => setAreChildrenHidden(false)}
          >
            Show Replies
          </button>
        </>
      )}
    </>
  );
}
