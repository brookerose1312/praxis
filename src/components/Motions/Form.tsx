import { useState, ChangeEvent, useEffect, useRef, Fragment } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  FormGroup,
  Input,
  Button,
  NativeSelect,
  FormControl,
  InputLabel,
  makeStyles,
} from "@material-ui/core";
import Router from "next/router";
import { RemoveCircle, Image } from "@material-ui/icons";

import baseUrl from "../../utils/baseUrl";
import { CURRENT_USER, IMAGES_BY_MOTION_ID } from "../../apollo/client/queries";
import {
  CREATE_MOTION,
  UPDATE_MOTION,
  DELETE_IMAGE,
} from "../../apollo/client/mutations";
import { Motions } from "../../constants";
import ActionFields from "./ActionFields";
import styles from "../../styles/Motion/MotionForm.module.scss";

const color = { color: "rgb(170, 170, 170)" };
const useStyles = makeStyles(() => ({
  select: { ...color },
  textInput: { ...color },
}));

interface Props {
  motion?: Motion;
  motions?: Motion[];
  isEditing?: boolean;
  setMotions?: (motions: Motion[]) => void;
  group?: Group;
}

const MotionsForm = ({
  motion,
  motions,
  isEditing,
  setMotions,
  group,
}: Props) => {
  const [imagesInputKey, setImagesInputKey] = useState<string>("");
  const [savedImages, setSavedImages] = useState<Image[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [body, setBody] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [actionData, setActionData] = useState<ActionData>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const imagesInput = useRef<HTMLInputElement>(null);

  const [createMotion] = useMutation(CREATE_MOTION);
  const [updateMotion] = useMutation(UPDATE_MOTION);
  const [deleteImage] = useMutation(DELETE_IMAGE);
  const currentUserRes = useQuery(CURRENT_USER);
  const [getSavedImagesRes, savedImagesRes] = useLazyQuery(
    IMAGES_BY_MOTION_ID,
    {
      fetchPolicy: "no-cache",
    }
  );
  const classes = useStyles();

  useEffect(() => {
    if (isEditing && motion) {
      setBody(motion.body);
      setAction(motion.action);
    }
  }, [motion, isEditing]);

  useEffect(() => {
    if (motion) getSavedImagesRes({ variables: { motionId: motion.id } });
  }, []);

  useEffect(() => {
    setSavedImages(
      savedImagesRes.data ? savedImagesRes.data.imagesByMotionId : []
    );
  }, [savedImagesRes.data]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (currentUserRes.data) {
      setSubmitLoading(true);
      if (isEditing && motion) {
        try {
          setBody("");
          await updateMotion({
            variables: {
              id: motion.id,
              body,
              action,
              actionData,
              images,
            },
          });
          // Redirect to Show Motion after update
          Router.push(`/motions/${motion.id}`);
        } catch (err) {
          alert(err);
        }
      } else {
        try {
          setBody("");
          setAction("");
          setImages([]);
          e.target.reset();
          const { data } = await createMotion({
            variables: {
              body,
              images,
              action,
              actionData,
              groupId: group?.id,
              userId: currentUserRes.data.user.id,
            },
          });
          if (motions && setMotions)
            setMotions([...motions, data.createMotion.motion]);
        } catch (err) {
          alert(err);
        }
      }
      setSubmitLoading(false);
    }
  };

  const handleActionChange = (event: React.ChangeEvent<{ value: string }>) => {
    setAction(event.target.value);
  };

  const deleteImageHandler = async (id: string) => {
    try {
      await deleteImage({
        variables: {
          id,
        },
      });
      // Removes deleted image from state
      setSavedImages(savedImages.filter((image: Image) => image.id !== id));
    } catch {}
  };

  const removeSelectedImage = (imageName: string) => {
    setImages(
      [...images].filter((image) => {
        return image.name !== imageName;
      })
    );
    setImagesInputKey(Math.random().toString(2));
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e)}
      className={styles.form}
      style={group && { marginTop: "48px" }}
    >
      <FormGroup>
        <Input
          type="text"
          placeholder={submitLoading ? "Loading..." : "Make a motion..."}
          value={body}
          multiline
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setBody(e.target.value)
          }
          style={{
            marginBottom: "6px",
          }}
          classes={{
            input: classes.textInput,
          }}
        />

        <FormControl style={{ marginBottom: "20px" }}>
          <InputLabel
            style={{ color: "rgb(105, 105, 105)", fontFamily: "Inter" }}
          >
            Motion type
          </InputLabel>
          <NativeSelect
            value={action}
            onChange={handleActionChange}
            classes={{
              select: classes.select,
            }}
          >
            <option aria-label="None" value="" />
            <option value={Motions.ActionTypes.PlanEvent}>Plan event</option>
            <option value={Motions.ActionTypes.ChangeName}>Change name</option>
            <option value={Motions.ActionTypes.ChangeDescription}>
              Change description
            </option>
            <option value={Motions.ActionTypes.ChangeImage}>
              Change group image
            </option>
            <option value={Motions.ActionTypes.ChangeSettings}>
              Change group settings
            </option>
            <option value={Motions.ActionTypes.Test}>Just a test</option>
          </NativeSelect>
        </FormControl>

        <ActionFields actionType={action} setActionData={setActionData} />

        <input
          multiple
          type="file"
          accept="image/*"
          key={imagesInputKey}
          ref={imagesInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            e.target.files && setImages([...e.target.files])
          }
          className={styles.imageInput}
        />
        <Image
          className={styles.imageInputIcon}
          onClick={() => imagesInput.current?.click()}
          fontSize="large"
        />
      </FormGroup>

      <div className={styles.selectedImages}>
        {[...images].map((image) => {
          return (
            <Fragment key={image.name}>
              <img
                alt="Data could not render."
                className={styles.selectedImage}
                src={URL.createObjectURL(image)}
              />

              <RemoveCircle
                style={{ color: "white" }}
                onClick={() => removeSelectedImage(image.name)}
                className={styles.removeSelectedImageButton}
              />
            </Fragment>
          );
        })}

        {savedImages.map(({ id, path }) => {
          return (
            <Fragment key={id}>
              <img
                alt="Data could not render."
                className={styles.selectedImage}
                src={baseUrl + path}
              />

              <RemoveCircle
                style={{ color: "white" }}
                onClick={() => deleteImageHandler(id)}
                className={styles.removeSelectedImageButton}
              />
            </Fragment>
          );
        })}
      </div>

      <Button
        variant="contained"
        type="submit"
        style={{ color: "white", backgroundColor: "rgb(65, 65, 65)" }}
      >
        {isEditing ? "Save" : "Motion"}
      </Button>
    </form>
  );
};

export default MotionsForm;
