import React, { ChangeEvent, useEffect } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  FormGroup,
  Button,
  Switch,
  makeStyles,
  NativeSelect,
  Grid,
  Slider,
  Input,
  CircularProgress,
} from "@material-ui/core";
import { ClassNameMap } from "@material-ui/core/styles/withStyles";

import { Votes, Settings } from "../../constants";
import { UPDATE_SETTINGS } from "../../apollo/client/mutations";
import styles from "../../styles/Setting/SettingsForm.module.scss";
import Messages from "../../utils/messages";
import { useCurrentUser } from "../../hooks";
import { displayName } from "../../utils/items";

const useStyles = makeStyles(() => ({
  toggle: {
    "& .Mui-checked .MuiSwitch-thumb": {
      color: "inherit",
    },
    "& .MuiSwitch-thumb": {
      color: "rgb(170, 170, 170)",
    },
  },
  select: { color: "rgb(170, 170, 170)" },
  sliderRail: { width: "100px" },
}));

const NumberInput = ({
  value,
  name,
  minimum,
  handleSettingChange,
  classes,
}: {
  value: string;
  name: string;
  minimum: number;
  handleSettingChange: (
    event: ChangeEvent<{ value: string }>,
    name: string
  ) => void;
  classes: ClassNameMap<"toggle" | "select" | "sliderRail">;
}) => (
  <Input
    value={value}
    margin="dense"
    onChange={(e) => handleSettingChange(e, name)}
    inputProps={{
      min: minimum,
      type: "number",
    }}
    classes={{ input: classes.select }}
    style={{ width: "50px" }}
  />
);

interface Props {
  settings: Setting[];
  setSettings: (settings: Setting[]) => void;
  unsavedSettings?: Setting[];
  setUnsavedSettings?: (settings: Setting[]) => void;
  anyUnsavedSettings?: boolean;
}

const SettingsForm = ({
  settings,
  setSettings,
  unsavedSettings,
  setUnsavedSettings,
  anyUnsavedSettings,
}: Props) => {
  const currentUser = useCurrentUser();
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [updateSettings] = useMutation(UPDATE_SETTINGS);
  const classes = useStyles();

  useEffect(() => {
    if (
      unsavedSettings &&
      setUnsavedSettings &&
      settings.length &&
      !unsavedSettings.length
    )
      setUnsavedSettings(settings);
  }, [settings]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { data } = await updateSettings({
        variables: {
          settings: settings.map(({ id, groupId, value }) => {
            return { id, groupId, value };
          }),
        },
      });
      const newSettings = data.updateSettings.settings;
      if (setUnsavedSettings) setUnsavedSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      alert(err);
    }
    setSubmitLoading(false);
  };

  const handleSettingChange = (
    event: ChangeEvent<{ value: string }>,
    name: string
  ) => {
    setByName(name, event.target.value);
  };

  const handleSwitchChange = (name: string, value: string) => {
    setByName(name, value === "true" ? "false" : "true");
  };

  const handleSliderChange = (_event: any, newValue: number | number[]) => {
    setByName(
      Settings.GroupSettings.RatificationThreshold,
      newValue.toString()
    );
  };

  const handleBlur = (value: string) => {
    if (parseInt(value) < 0 || value === "") {
      setByName(Settings.GroupSettings.RatificationThreshold, "1");
    } else if (parseInt(value) > 100) {
      setByName(Settings.GroupSettings.RatificationThreshold, "100");
    }
  };

  const setByName = (name: string, value: string) => {
    setSettings(
      settings.map((setting) => {
        if (setting.name === name)
          return {
            ...setting,
            value,
          };
        return setting;
      })
    );
  };

  const valueByName = (name: string): string => {
    const setting = settings.find((setting) => setting.name === name);
    return setting?.value || "";
  };

  const canShowSetting = (name: string): boolean => {
    const votingType = valueByName(Settings.GroupSettings.VotingType);
    if (!votingType) return false;
    if (
      votingType !== Votes.VotingTypes.Consensus &&
      (name === Settings.GroupSettings.RatificationThreshold ||
        name === Settings.GroupSettings.ReservationsLimit ||
        name === Settings.GroupSettings.StandAsidesLimit)
    )
      return false;
    if (
      votingType !== Votes.VotingTypes.XToPass &&
      (name === Settings.GroupSettings.XToPass ||
        name === Settings.GroupSettings.XToBlock)
    )
      return false;

    return true;
  };

  if (currentUser && !settings.length)
    return <CircularProgress style={{ color: "white" }} />;

  if (!currentUser) return <>{Messages.users.permissionDenied()}</>;

  return (
    <form onSubmit={(e) => handleSubmit(e)} className={styles.form}>
      <FormGroup>
        {settings.map(({ id, name, value }: Setting) => {
          if (canShowSetting(name))
            return (
              <div key={id} className={styles.setting}>
                <div className={styles.settingName}>{displayName(name)}</div>

                {name === Settings.GroupSettings.NoAdmin && (
                  <Switch
                    checked={value === Settings.States.On}
                    onChange={() => handleSwitchChange(name, value)}
                    className={classes.toggle}
                    color="primary"
                  />
                )}

                {name === Settings.GroupSettings.VotingType && (
                  <NativeSelect
                    value={value}
                    onChange={(e) => handleSettingChange(e, name)}
                    classes={{
                      select: classes.select,
                    }}
                  >
                    <option aria-label={Messages.forms.none()} value="" />
                    <option value={Votes.VotingTypes.Consensus}>
                      {Messages.votes.votingTypes.consensus()}
                    </option>
                    <option value={Votes.VotingTypes.XToPass}>
                      {Messages.votes.votingTypes.xToPass()}
                    </option>
                    <option value={Votes.VotingTypes.Majority}>
                      {Messages.votes.votingTypes.majority()}
                    </option>
                  </NativeSelect>
                )}

                {name === Settings.GroupSettings.VoteVerification && (
                  <Switch
                    checked={value === Settings.States.On}
                    onChange={() => handleSwitchChange(name, value)}
                    className={classes.toggle}
                    color="primary"
                  />
                )}

                {(name === Settings.GroupSettings.XToPass ||
                  name === Settings.GroupSettings.XToBlock) && (
                  <NumberInput
                    value={value}
                    name={name}
                    minimum={1}
                    handleSettingChange={handleSettingChange}
                    classes={classes}
                  />
                )}

                {(name === Settings.GroupSettings.ReservationsLimit ||
                  name === Settings.GroupSettings.StandAsidesLimit) && (
                  <NumberInput
                    value={value}
                    name={name}
                    minimum={0}
                    handleSettingChange={handleSettingChange}
                    classes={classes}
                  />
                )}

                {name === Settings.GroupSettings.RatificationThreshold && (
                  <Grid
                    container
                    spacing={2}
                    justify="flex-end"
                    style={{ marginBottom: "-50px" }}
                  >
                    <Grid item xs={5}>
                      <Slider
                        min={1}
                        max={100}
                        value={parseInt(value)}
                        onChange={handleSliderChange}
                      />
                    </Grid>
                    <Grid item>
                      <Input
                        value={value}
                        margin="dense"
                        onChange={(e) => handleSettingChange(e, name)}
                        onBlur={() => handleBlur(value)}
                        inputProps={{
                          min: 1,
                          max: 100,
                          type: "number",
                        }}
                        classes={{
                          input: classes.select,
                        }}
                      />
                      %
                    </Grid>
                  </Grid>
                )}
              </div>
            );
        })}
      </FormGroup>

      {anyUnsavedSettings && (
        <Button
          variant="contained"
          type="submit"
          style={{
            color: "white",
            backgroundColor: "rgb(65, 65, 65)",
          }}
        >
          {submitLoading ? Messages.states.saving() : Messages.actions.save()}
        </Button>
      )}
    </form>
  );
};

export default SettingsForm;
