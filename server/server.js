import fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import cookie from "@fastify/cookie";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const app = fastify();
app.register(sensible);
//cookie faker
app.register(cookie, { secret: process.env.COOKIE_SECRET });
app.register(cors, {
  origin: process.env.CLIENT_URL,
  credentials: true,
});
//middleware
//cookie login faker
app.addHook("onRequest", (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie("userId");
    res.setCookie("userId", CURRENT_USER_ID);
  }
  done();
});
const prisma = new PrismaClient();
//log as Ewiwi
const CURRENT_USER_ID = (
  await prisma.user.findFirst({ where: { name: "Ewiwi" } })
).id;

const COMMENT_SELECT_FIELDS = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

// se pone la funcion dentro de commitToDB para que tenga el erro handler
// como las funciones son async se usa el await

app.get("/posts", async (req, res) => {
  return await commitToDB(
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
      },
    })
  );
});

app.get("/posts/:id", async (req, res) => {
  return await commitToDB(
    prisma.post
      .findUnique({
        where: { id: req.params.id },
        select: {
          body: true,
          title: true,
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              ...COMMENT_SELECT_FIELDS,
              _count: { select: { likes: true } },
            },
          },
        },
      })
      .then(async post => {
        const likes = await prisma.like.findMany({
          where: {
            //recupera los likes correspondientes al user
            userId: req.cookies.userId,
            //recupera todos los likes del post
            commentId: { in: post.comments.map(comment => comment.id) },
          },
        });

        return {
          //recupera la info del post
          ...post,
          comments: post.comments.map(comment => {
            const { _count, ...commentFields } = comment;
            return {
              //recupera la info de los comentarios
              ...commentFields,
              //añade la nueva info de los likes
              likedByMe: likes.find(like => like.commentId === comment.id),
              likeCount: _count.likes,
            };
          }),
        };
      })
  );
});

//post comment
app.post("/posts/:id/comments", async (req, res) => {
  //check if comment exist
  if (req.body.message === "" || req.body.message == null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  return await commitToDB(
    prisma.comment
      .create({
        data: {
          message: req.body.message,
          userId: req.cookies.userId,
          parentId: req.body.parentId,
          postId: req.params.id,
        },
        select: COMMENT_SELECT_FIELDS,
      })
      .then(comment => {
        return {
          ...comment,
          likeCount: 0,
          likedByMe: false,
        };
      })
  );
});

//update comment
app.put("/posts/:postId/comments/:commentId", async (req, res) => {
  //check if comment exist
  if (req.body.message === "" || req.body.message == null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }

  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You don't have permission to edit this message"
      )
    );
  }
  return await commitToDB(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true },
    })
  );
});

//delete comment
app.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You don't have permission to delete this message"
      )
    );
  }
  return await commitToDB(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    })
  );
});

//like comments
app.post("/posts/:id/comments/:commentId/toggleLike", async (req, res) => {
  const data = {
    commentId: req.params.commentId,
    userId: req.cookies.userId,
  };

  const like = await prisma.like.findUnique({
    where: { userId_commentId: data },
  });

  if (like == null) {
    return await commitToDB(prisma.like.create({ data })).then(() => {
      return { addLike: true };
    });
  } else {
    return await commitToDB(
      prisma.like.delete({
        where: {
          userId_commentId,
        },
      })
    ).then(() => {
      return { addLike: false };
    });
  }
});

//error handler
async function commitToDB(promise) {
  const [error, data] = await app.to(promise);
  if (error) return app.httpErrors.internalServerError(error.message);
  return data;
}
//console.log({ port: process.env.PORT });
app.listen({ port: process.env.PORT });
