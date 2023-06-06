import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getPost } from "../services/posts";

const Context = React.createContext();

export function usePost() {
  return useContext(Context);
}

export function PostProvider({ children }) {
  //consigue la id del post
  const { id } = useParams();
  //toma el post con la id, si la id cambia se actualiza
  const { loading, error, value: post } = useAsync(() => getPost(id), [id]);
  //crea un array local con los comentarios
  const [comments, setComments] = useState([]);

  //nesting comments
  const commentsByParentId = useMemo(() => {
    if (comments == null) return [];
    const group = {};
    comments.forEach(comment => {
      //si el group no tiene un Id, crea un array vacio
      group[comment.parentId] ||= [];
      group[comment.parentId].push(comment);
    });
    return group;
  }, [comments]);

  //cuando se cargan los pots, se guardan todos los comentarios dentro de la variable comments
  useEffect(() => {
    if (post?.comments == null) return;
    setComments(post.comments);
  }, [post?.comments]);

  function getReplies(parentId) {
    return commentsByParentId[parentId];
  }

  function createLocalComment(comment) {
    setComments(prevComments => {
      return [comment, ...prevComments];
    });
  }

  function updateLocalComment(id, message) {
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment.id === id) {
          return { ...comment, message };
        } else {
          return comment;
        }
      });
    });
  }

  function deleteLocalComment(id) {
    setComments(prevComments => {
      return prevComments.filter(comment => comment.id !== id);
    });
  }

  function toggleLocalCommentLike(id, addLike) {
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (id === comment.id) {
          if (addLike) {
            return {
              ...comment,
              likeCount: comment.likeCount + 1,
              likedByMe: true,
            };
          } else {
            return {
              ...comment,
              likeCount: comment.likeCount + 1,
              likedByMe: false,
            };
          }
        } else {
          return comment;
        }
      });
    });
  }

  return (
    <Context.Provider
      value={{
        post: { id, ...post },
        rootComments: commentsByParentId[null],
        getReplies,
        createLocalComment,
        updateLocalComment,
        deleteLocalComment,
        toggleLocalCommentLike,
      }}
    >
      {loading ? (
        <h1>Loading </h1>
      ) : error ? (
        <h1 className="error-msg"> {error}</h1>
      ) : (
        children
      )}
    </Context.Provider>
  );
}
