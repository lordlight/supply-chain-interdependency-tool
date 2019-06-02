import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import GestureIcon from "@material-ui/icons/Gesture";
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';

import { connect } from "react-redux";
import store from '../../redux/store';
import { answerMulti } from "../../redux/actions";

import { random } from "lodash";

const mapState = state => ({
    currentType: state.currentType,
    suppliers: state.suppliers,
    suppliersInactive: state.suppliersInactive,
    products: state.products,
    productsInactive: state.productsInactive,
    projects: state.projects,
    projectsInactive: state.projectsInactive,
    supplierQuestions: state.supplierQuestions,
    productQuestions: state.productQuestions,
    projectQuestions: state.projectQuestions,
    supplierResponses: state.supplierResponses,
    productResponses: state.productResponses,
    projectResponses: state.projectResponses
});

const styles = theme => ({
    card: {
        display:"inline-flex",
        flexShrink: 0,
        flexGrow: 0,
        flexDirection: 'column',
        width: 344,
        height: 194,
        margin: 12,
    },
    title: {
        fontSize: 13,
        fontWeight: "regular",
        textTransform: "capitalize",
    },
    heading: {
        fontSize: 25,
        textTransform: 'capitalize',
    },
    inactive: {
        fontSize: 16,
        color: "gray"
    }
  });

class QuestionStatusCard extends Component {

    state = {
        dialogOpen: false
    }

    randomizeAnswers = () => {
        const randomDate = () => {
            return Date.now() - Math.random() * 604800000.0 * 4;
        }

        const type = this.props.currentType;
        let items, questions, responses;
        if (type === "suppliers"){
            items = [...this.props.suppliers];
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            items = [...this.props.products];
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            items = [...this.props.projects];
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }
        items.forEach(i => {
            const itemId = i.ID;
            responses = {...responses[itemId] || {}};
            questions.forEach(q => {
                const qtype = q["Type of question"];
                const qrelation = q.Relation;
                if (qtype === "criticality" && qrelation) {
                    const [_, qkey] = qrelation.split(";");
                    const qvals = (i[qkey] || "").split(";").filter(v => !!v);
                    qvals.forEach(qval => {
                        const qid = `${q.ID}|${qval}`;
                        if (Math.random() < 0.7) {
                            const answer = random(q.Answers.length - 1);
                            console.log(itemId, qid, q.Answers.length, answer);
                            responses[qid] = [answer, randomDate()];
                        } else {
                            // question not answered
                            delete responses[qid];
                        }
                    });
                } else {
                    if (Math.random() < 0.7) {
                        const answer = random(q.Answers.length - 1);
                        console.log(itemId, q.ID, q.Answers.length, answer);
                        responses[q.ID] = [answer, randomDate()];
                    } else {
                        // question not answered
                        delete responses[q.ID];
                    }
                }
            });
            store.dispatch(answerMulti({
                type,
                itemId,
                responses
            }));
        });
    }

    handleClose = () => {
        this.setState({ dialogOpen: false });
      };

    render() {
        const { classes } = this.props;
        
        const type = this.props.currentType;
        let items, itemsInactive, questions, responses;

        if (type === "suppliers"){
            items = [...this.props.suppliers];
            itemsInactive = [...this.props.suppliersInactive];
            questions = this.props.supplierQuestions;
            responses = this.props.supplierResponses;
        } else if (type === "products"){
            items = [...this.props.products];
            itemsInactive = [...this.props.productsInactive];
            questions = this.props.productQuestions;
            responses = this.props.productResponses;
        } else if (type === "projects"){
            items = [...this.props.projects];
            itemsInactive = [...this.props.projectsInactive];
            questions = this.props.projectQuestions;
            responses = this.props.projectResponses;
        }

        let numCompleted = 0, numPartial = 0, numZero = 0;

        items.forEach((item) => {
            let numResp = Object.keys(responses[item.ID] || []).length;
            if (numResp === questions.length){
                numCompleted += 1;
            } else if (numResp > 0){
                numPartial += 1;
            } else {
                numZero += 1;
            }
        });

        return (
            <Card className={classes.card}>
                <CardContent>
                    <Typography gutterBottom className={classes.title}>
                        {type.substring(0, type.length - 1)} question status
                    </Typography>
                    {itemsInactive.length > 0 ? (
                        <div style={{display:"flex", alignItems: "baseline"}}>
                            <Typography gutterBottom className={classes.heading}>
                                {items.length} {type}
                            </Typography>
                            <Typography gutterBottom className={classes.inactive}>
                                &nbsp;(+ {itemsInactive.length} inactive)
                            </Typography>
                            <Typography gutterBottom className={classes.heading}>
                                :
                            </Typography>
                        </div>) : (
                        <Typography gutterBottom className={classes.heading}>
                            {items.length} {type}:
                        </Typography>)
                    }
                    <Typography className={classes.complete}  component="div">
                        {numCompleted} {type} with complete data
                    </Typography>
                    <Typography className={classes.partial}  component="div">
                        {numPartial} {type} with partial data
                    </Typography>
                    <Typography className={classes.zero}  component="div">
                        {numZero} {type} with no data
                    </Typography>
                    </CardContent>
                <CardActions style={{justifyContent: "flex-end"}}>
                    <IconButton size="small" style={{opacity:0.00}} onClick={() => this.setState({ dialogOpen: true })}>
                        <GestureIcon />
                    </IconButton>
                </CardActions>
                <Dialog onClose={() => this.setState({ dialogOpen: false })} aria-labelledby="simple-dialog-title" open={this.state.dialogOpen}>
                    <DialogTitle id="simulation-dialog-title">Generate Random Answers</DialogTitle>
                    <DialogContent>
                    <DialogContentText>
                    This will replace all existing answers with randomly generated answers. Continue?
                    </DialogContentText>
                </DialogContent>
                    <DialogActions>
                    <Button onClick={this.handleClose} color="primary">
                    Cancel
                    </Button>
                    <Button onClick={() => {this.randomizeAnswers(); this.handleClose();}} color="primary">
                    Continue
                    </Button>
                </DialogActions>
                </Dialog>
            </Card>
        );
    }
}

export default withStyles(styles)(connect(mapState)(QuestionStatusCard));