import React, { useState, useEffect } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import { Spinner } from "react-bootstrap";
import { useRouter } from "next/router";

import CommentForm from "../../../components/Comments/Form";
import { COMMENT } from "../../../apollo/client/queries";

const Edit = () => {
  const { query } = useRouter();
  const [comment, setComment] = useState<Comment>();
  const [getCommentsRes, commentsRes] = useLazyQuery(COMMENT);

  useEffect(() => {
    if (query.id)
      getCommentsRes({
        variables: { id: query.id },
      });
  }, [query.id]);

  useEffect(() => {
    setComment(commentsRes.data ? commentsRes.data.comment : commentsRes.data);
  }, [commentsRes.data]);

  if (comment) return <CommentForm comment={comment} isEditing={true} />;
  return <Spinner animation="border" />;
};

export default Edit;