import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Input, makeStyles } from "@material-ui/core";
import { Image } from "@material-ui/icons";
import { Motions } from "../../constants";
import styles from "../../styles/Motion/ActionFields.module.scss";

const color = { color: "rgb(170, 170, 170)" };
const useStyles = makeStyles(() => ({
  select: { ...color },
  textInput: { ...color },
}));

interface TextInputProps {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}

const TextInput = ({ value, setValue, placeholder }: TextInputProps) => {
  const classes = useStyles();
  return (
    <Input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      style={{
        marginBottom: "24px",
      }}
      classes={{
        input: classes.textInput,
      }}
    />
  );
};

interface Props {
  actionType: string;
  setActionData: (actionData: ActionData) => void;
}

const ActionFields = ({ actionType, setActionData }: Props) => {
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<File>();
  const imagesInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!!text.length) {
      let actionData = Motions.ActionData.NewGroupName;
      if (actionType === Motions.ActionTypes.ChangeDescription)
        actionData = Motions.ActionData.NewGroupDescription;
      setActionData({
        [actionData]: text,
      });
    }
    if (image && Motions.ActionTypes.ChangeImage) {
      setActionData({
        [Motions.ActionData.NewGroupImage]: image,
      });
    }
  }, [text, image, actionType]);

  if (actionType === Motions.ActionTypes.ChangeName)
    return (
      <TextInput placeholder="New group name" value={text} setValue={setText} />
    );

  if (actionType === Motions.ActionTypes.ChangeDescription)
    return (
      <TextInput
        placeholder="New group description"
        value={text}
        setValue={setText}
      />
    );

  if (actionType === Motions.ActionTypes.ChangeImage)
    return (
      <>
        {image && (
          <img
            alt="Data could not render."
            src={URL.createObjectURL(image)}
            style={{
              width: "50%",
              display: "block",
              marginBottom: 6,
            }}
          />
        )}

        <input
          type="file"
          accept="image/*"
          ref={imagesInput}
          className={styles.imageInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            e.target.files && setImage(e.target.files[0])
          }
        />
        <span
          className={styles.attachImage}
          onClick={() => imagesInput.current?.click()}
        >
          <Image className={styles.imageInputIcon} fontSize="small" />
          Attach new group image
        </span>
      </>
    );

  if (actionType && actionType !== Motions.ActionTypes.Test)
    return (
      <span style={{ marginBottom: "12px" }}>
        This action type is still in development...
      </span>
    );

  return <></>;
};

export default ActionFields;
