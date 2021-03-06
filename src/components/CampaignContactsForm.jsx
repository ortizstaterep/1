import React, { PropTypes as type } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import Subheader from 'material-ui/Subheader'
import Divider from 'material-ui/Divider'
import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../lib'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import CheckIcon from 'material-ui/svg-icons/action/check-circle'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ErrorIcon from 'material-ui/svg-icons/alert/error'
import theme from '../styles/theme'
import { StyleSheet, css } from 'aphrodite'
import yup from 'yup'

const checkIcon = <CheckIcon style={{ fill: theme.colors.darkGreen }} />
const warningIcon = <WarningIcon style={{ fill: theme.colors.orange }} />
const errorIcon = <ErrorIcon style={{ fill: theme.colors.red }} />

const innerStyles = {
  button: {
    margin: '24px 5px 24px 0',
    fontSize: '10px'
  },
  nestedItem: {
    fontSize: '12px'
  }
}

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: 'Courier',
    backgroundColor: theme.colors.lightGray,
    padding: 3
  },
  exampleImageInput: {
    cursor: 'pointer',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    opacity: 0
  }
})

export default class CampaignContactsForm extends React.Component {
  state = {
    uploading: false,
    validationStats: null,
    contactUploadError: null
  }

  handleUpload = (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    this.setState({ uploading: true }, () => {
      parseCSV(file, this.props.optOuts, ({ contacts, customFields, validationStats, error }) => {
        if (error) {
          this.handleUploadError(error)
        } else if (contacts.length === 0) {
          this.handleUploadError('Upload at least one contact')
        } else if (contacts.length > 0) {
          this.handleUploadSuccess(validationStats, contacts, customFields)
        }
      })
    })
  }

  handleUploadError(error) {
    this.setState({
      validationStats: null,
      uploading: false,
      contactUploadError: error,
      contacts: null
    })
  }

  handleUploadSuccess(validationStats, contacts, customFields) {
    this.setState({
      validationStats,
      uploading: false,
      contactUploadError: null
    })
    const contactCollection = {
      contactsCount: contacts.length,
      customFields,
      contacts
    }
    this.props.onChange(contactCollection)
  }

  renderContactStats() {
    const { customFields, contactsCount } = this.props.formValues

    if (contactsCount === 0) {
      return ''
    }
    return (
      <List>
        <Subheader>Uploaded</Subheader>
        <ListItem
          primaryText={`${contactsCount} contacts`}
          leftIcon={checkIcon}
          leftIconColor={theme.colors.green}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={checkIcon}
          nestedItems={customFields.map((field) => (
            <ListItem
              innerDivStyle={innerStyles.nestedItem}
              primaryText={field}
            />
          ))}
        />
      </List>
    )
  }

  renderValidationStats() {
    if (!this.state.validationStats) {
      return ''
    }

    const { dupeCount, missingCellCount, invalidCellCount, optOutCount } = this.state.validationStats

    let stats = [
      [dupeCount, 'duplicates'],
      [missingCellCount, 'rows with missing numbers'],
      [invalidCellCount, 'rows with invalid numbers'],
      [optOutCount, 'opt-outs']
    ]
    stats = stats
      .filter(([count]) => count > 0)
      .map(([count, text]) => `${count} ${text} removed`)
    return (
      <List>
        <Divider />
        {stats.map((stat) => (
          <ListItem
            leftIcon={warningIcon}
            innerDivStyle={innerStyles.nestedItem}
            primaryText={stat}
          />
        ))}
      </List>
    )
  }

  renderUploadButton() {
    const { uploading } = this.state
    if (this.props.ensureComplete) {
      return <div></div>
    }
    return (
      <RaisedButton
        style={innerStyles.button}
        label={uploading ? 'Uploading...' : 'Upload contacts'}
        labelPosition='before'
        disabled={uploading}
      >
        <input
          type='file'
          className={css(styles.exampleImageInput)}
          onChange={this.handleUpload}
        />
      </RaisedButton>
    )
  }

  renderForm() {
    const { contactUploadError } = this.state

    return (
      <div>
        <GSForm
          schema={yup.object({})}
          onSubmit={this.props.onSubmit}
        >
          {this.renderUploadButton()}
          {this.renderContactStats()}
          {this.renderValidationStats()}
          {contactUploadError ? (
            <List>
              <ListItem
                primaryText={contactUploadError}
                leftIcon={errorIcon}
              />
            </List>
          ) : ''}
          {this.props.ensureComplete ? '' : (
            <Form.Button
              type='submit'
              disabled={this.props.saveDisabled}
              label={this.props.saveLabel}
            />
          )}
        </GSForm>
      </div>
    )
  }

  render() {
    let subtitle = (
      <span>
        Your upload file should be in CSV format with column headings in
        the first row. You must include <span className={css(styles.csvHeader)}>firstName</span>,
        <span className={css(styles.csvHeader)}>lastName</span>, and
        <span className={css(styles.csvHeader)}>cell</span> columns. If you include a <span className={css(styles.csvHeader)}>zip</span> column,
        we'll use the zip to guess the contact's timezone for enforcing texting hours.
        Any additional columns in your file will be available as custom fields to use in your texting scripts.
      </span>
    )
    if (this.props.ensureComplete) {
      subtitle = (
        <span>
          This campaign has already started, so you won't be able to modify the contacts you've already uploaded to this campaign.
        </span>
      )
    }

    return (
      <div>
        <CampaignFormSectionHeading
          title='Who are you contacting?'
          subtitle={subtitle}
        />
        {this.renderForm()}
      </div>
    )
  }
}

CampaignContactsForm.propTypes = {
  onChange: type.func,
  optOuts: type.array,
  formValues: type.object,
  ensureComplete: type.bool,
  onSubmit: type.func,
  saveDisabled: type.bool,
  saveLabel: type.string
}
