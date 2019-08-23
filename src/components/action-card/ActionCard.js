import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";

// Images
import recommendationImg from "../../imgs/recommendations.png";
import checklistImg from "../../imgs/checklist.png";

const styles = theme => ({
  card: {
    display: "inline-flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "column",
    width: 344,
    margin: 12,
    position: "relative",
    minHeight: 296
  },
  content: {
    position: "relative"
  },
  desc: {
    fontSize: "15px",
    height: "48px",
    overflow: "hidden",
    lineHeight: "1",
    textOverflow: "ellipsis"
  },
  media: {
    height: 194,
    width: 344
  },
  paper: {
    position: "absolute",
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: "none"
  },
  img: {
    position: "absolute",
    top: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
    maxWidth: 80,
    maxHeight: 80,
    width: "auto",
    height: "auto"
  },
  title: {
    fontSize: 13,
    fontWeight: "regular",
    textTransform: "uppercase"
  },
  heading: {
    fontSize: 25,
    paddingBottom: 24,
    textTransform: "capitalize"
  },
  item: {
    color: "rgba(0, 0, 0, 0.6)"
  }
});

class ActionCard extends Component {
  render() {
    const { classes, type, items, title, plural, emptyMessage } = this.props;

    let tempImg = recommendationImg;
    if (type === "checklist") {
      tempImg = checklistImg;
    }

    const itemElements = items.map((item, i) => (
      <Typography key={i} className={classes.item}>
        [ ] {item}
      </Typography>
    ));

    return (
      <div>
        <Card className={classes.card}>
          <CardContent className={classes.content}>
            <img src={tempImg} alt="Image" className={classes.img} />
            <Typography gutterBottom className={classes.title}>
              {title}
            </Typography>
            <Typography gutterBottom className={classes.heading}>
              {plural}
            </Typography>
            <Typography
              component="div"
              gutterBottom
              fontSize={21}
              color="textPrimary"
              fontWeight="bold"
            >
              {itemElements.length > 0 ? itemElements : emptyMessage || ""}
            </Typography>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default withStyles(styles)(ActionCard);
