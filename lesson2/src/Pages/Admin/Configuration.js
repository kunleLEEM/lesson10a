import React, { Component } from 'react';
import { withCookies } from 'react-cookie';
import { isUUID } from 'validator';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { resetClient, Client } from '../../Client';
import SpinnerBox from '../../Components/SpinnerBox';
import {
  defaultProjectId,
  selectedProjectCookieName,
  getSampleProjectItems
} from '../../Utilities/SelectedProject';
import { resetStores } from '../../Utilities/StoreManager';

// import KontentLogo from '../../Images/Admin/kk-logo.svg';

import './Admin.css';

const getWindowCenterPosition = (windowWidth, windowHeight) => {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;
  const screenWidth = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : window.screen.width;
  const screenHeight = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : window.screen.height;
  const left = screenWidth / 2 - windowWidth / 2 + dualScreenLeft;
  const top = screenHeight / 2 - windowHeight / 2 + dualScreenTop;
  return { left, top };
};

class Configuration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentProjectInputValue: this.props.cookies.get(
        selectedProjectCookieName
      ),
      preparingProject: false,
      unsubscribe: new Subject()
    };

    this.handleProjectInputChange = this.handleProjectInputChange.bind(this);
    this.handleSetProjectSubmit = this.handleSetProjectSubmit.bind(this);
    this.setNewProjectId = this.setNewProjectId.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.waitUntilProjectAccessible = this.waitUntilProjectAccessible.bind(
      this
    );
  }

  componentDidMount() {
    window.addEventListener('message', this.receiveMessage, false);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.receiveMessage);
    this.unsubscribe();
  }

  handleProjectInputChange(event) {
    this.setState({ currentProjectInputValue: event.target.value });
  }

  handleSetProjectSubmit(event) {
    event.preventDefault();
    const newProjectId = event.target[0].value;
    this.setNewProjectId(newProjectId);
  }

  setNewProjectId(newProjectId, newlyGeneratedProject) {
    if (!isUUID(newProjectId)) {
      const message = `Selected project (${newProjectId}) is not a valid GUID`;
      console.error(message);
      alert(message);
      this.setState({
        currentProjectInputValue: this.props.cookies.get(
          selectedProjectCookieName
        )
      });
      return;
    }

    resetClient(newProjectId);
    resetStores();
    if (newlyGeneratedProject) {
      this.waitUntilProjectAccessible(newProjectId);
      this.setState({
        preparingProject: true
      });
      return;
    }

    this.redirectToHome(newProjectId);
  }

  waitUntilProjectAccessible(newProjectId) {
    setTimeout(() => {
      Client.items()
        .elementsParameter(['id'])
        .depthParameter(0)
        .toObservable()
        .pipe(takeUntil(this.state.unsubscribe))
        .subscribe(response => {
          const sampleProjectListingResponse = getSampleProjectItems().subscribe(
            sampleProjectClientResult => {
              if (
                response.items.length >= sampleProjectClientResult.items.length
              ) {
                this.setState({
                  preparingProject: false
                });
                sampleProjectListingResponse.unsubscribe();
                this.redirectToHome(newProjectId);
              } else {
                sampleProjectListingResponse.unsubscribe();
                this.waitUntilProjectAccessible(newProjectId);
              }
            }
          );
        });
    }, 2000);
  }

  unsubscribe() {
    this.state.unsubscribe.next();
    this.state.unsubscribe.complete();
    this.setState({
      unsubscribe: new Subject()
    });
  }

  redirectToHome(newProjectId) {
    const infoMessage =
      newProjectId === defaultProjectId
        ? `You've configured your app to with a project ID of a shared Kentico Kontent project.`
        : `You've configured your app with a project ID "${newProjectId}". You can edit its contents at https://kontent.ai/.`;
    this.props.history.push(`/?infoMessage=${infoMessage}`);
  }

  openKenticoKontentProjectSelector(event) {
    event.preventDefault();
    const windowWidth = 800;
    const windowHeight = 800;
    const { left, top } = getWindowCenterPosition(windowWidth, windowHeight);

    window.open(
      'http://dev-minds.com/home',
      'Kentico Kontent',
      `status=no,width=${windowWidth},height=${windowHeight},resizable=yes,left=
      ${left},top=${top},toolbar=no,menubar=no,location=no,directories=no`
    );
  }

  receiveMessage(event) {
    if (event.origin.toLowerCase() !== 'https://app.kontent.ai') return;

    if (!event.data.projectGuid) {
      return;
    }

    this.setNewProjectId(
      event.data.projectGuid,
      event.data.newlyGeneratedProject
    );
  }

  render() {
    const message = this.state.preparingProject && (
      <SpinnerBox message="Waiting for the sample project to become ready..." />
    );
    return (
      <div className="project-configuration-section">
        <div className="logotype-row">
          <div className="content">
            {/* <div className="logotype">
              <a href="/" className="logotype-link">
                <img
                  src={KontentLogo}
                  alt="Kentico Kontent logo"
                  id="KenticoKontent"
                  width="100%"
                  height="100%"
                />
              </a>
            </div> */}
          </div>
        </div>
        <header>
          <div className="content">
            <h1>CS-104 - DevMinds Sample ReactJS App</h1>
            <p>
              This is a sample app you can use to test a cicd pipeline. 
              Other use cases is deploying this app in a production environment.

            </p>
            {message}
          </div>
        </header>
        <section>
          <h2>Navigate to dev-minds app portal</h2>
          <p>
            You can find out more about apps running on the dev-minds portal by clicking below. 
            This will take you to all the apps hosted within the dev-minds hosted zone.
          </p>
          <form onSubmit={this.openKenticoKontentProjectSelector}>
            <input
              type="submit"
              className="button-secondary"
              value="dev-minds app portal available here"
            />
          </form>
        </section>
        <div className="content sections-secondary divided">
          <section className="section-secondary">
            <h2>Contact CS-104 Team Member</h2>
            <p>
              Provide your email and we can get back to you.
            </p>
            <div className="inline-controls">
              <form onSubmit={this.handleSetProjectSubmit}>
                <div className="form-group">
                  <div className="form-group-label">
                    <label htmlFor="ProjectGuid">ProjectGuid</label>
                  </div>
                  <div className="form-group-input">
                    <input
                      id="ProjectGuid"
                      name="ProjectGuid"
                      placeholder="Email"
                      type="text"
                      value={this.state.currentProjectInputValue}
                      onChange={this.handleProjectInputChange}
                    />
                  </div>
                  <div className="message-validation">
                    <span className="field-validation-valid" />
                  </div>
                </div>
                <input
                  type="submit"
                  className="button-secondary"
                  value="Submit"
                />
              </form>
            </div>
          </section>
          <section className="section-secondary">
            <h2>Use the Shared Project</h2>
            <p>
              Alternatively, you may wish to use the shared project (project ID
              "{defaultProjectId}
              ").
            </p>
            <p>
              <strong>Note:</strong> You cannot edit content in the shared
              project.
            </p>
            {/* <input
              type="submit"
              className="button-secondary"
              value="Use the shared project"
              onClick={() => this.setNewProjectId(defaultProjectId)}
            /> */}
          </section>
        </div>
      </div>
    );
  }
}

export default withCookies(Configuration);
