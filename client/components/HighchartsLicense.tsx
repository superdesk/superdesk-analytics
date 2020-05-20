/* eslint-disable react/no-multi-comp */

import React from 'react';

import {appConfig} from 'appConfig';

import hc from 'highcharts';

import {IAnalyticsConfig} from '../interfaces';
import {superdeskApi} from '../superdeskApi';

interface IProps {
    closeModal(): void
}

class HighchartsLicenseModal extends React.PureComponent<IProps> {
    render() {
        const {
            Modal,
            ModalBody,
            ModalFooter,
        } = superdeskApi.components;
        const gettext = superdeskApi.localization.gettext;
        const config: IAnalyticsConfig = appConfig as IAnalyticsConfig;
        const highchartsVersionLink = `https://www.highcharts.com/blog/changelog/#highcharts-v${hc.version}`;
        const licenseType = config.highcharts_license_type ?? gettext('OEM');

        return (
            <Modal>
                <div className="modal__header modal__header--about">
                    <button className="modal__close pull-right" onClick={this.props.closeModal}>
                        <i className="icon-close-small" />
                    </button>
                    <h2 style={{color: 'white'}}>{gettext('Highcharts {{licenseType}} License', {licenseType})}</h2>
                </div>
                <ModalBody>
                    <div>
                        <p>{gettext('The use of Highcharts is provided under a license with the following details:')}</p>
                    </div>
                    <div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>{gettext('License Type')}:</td>
                                    <td>{licenseType}</td>
                                </tr>
                                {config.highcharts_licensee && (
                                    <tr>
                                        <td>{gettext('Licensee:')}</td>
                                        <td>{config.highcharts_licensee}</td>
                                    </tr>
                                )}
                                {config.highcharts_licensee_contact && (
                                    <tr>
                                        <td>{gettext('Licensee Contact:')}</td>
                                        <td>
                                            <a href={`mailto:${config.highcharts_licensee_contact}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {config.highcharts_licensee_contact}
                                            </a>
                                        </td>
                                    </tr>
                                )}
                                {config.highcharts_license_id && (
                                    <tr>
                                        <td>{gettext('License ID:')}</td>
                                        <td>{config.highcharts_license_id}</td>
                                    </tr>
                                )}
                                {config.highcharts_license_customer_id && (
                                    <tr>
                                        <td>{gettext('Customer Installation No.:')}</td>
                                        <td>{config.highcharts_license_customer_id}</td>
                                    </tr>
                                )}
                                {config.highcharts_license_expiry && (
                                    <tr>
                                        <td>{gettext('Expiry Date:')}</td>
                                        <td>{config.highcharts_license_expiry}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td>{gettext('Installed Version:')}</td>
                                    <td>
                                        <a href={highchartsVersionLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            v{hc.version}
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn--primary" onClick={this.props.closeModal} >
                        {gettext('Close')}
                    </button>
                </ModalFooter>
            </Modal>
        );
    }
}

function showHighchartsModal(): void {
    superdeskApi.ui.showModal(HighchartsLicenseModal);
}

export class HighchartsLicense extends React.PureComponent {
    render() {
        return (
            <button className="btn btn--success btn--icon-only btn--hollow"
                data-sd-tooltip="Highcharts License"
                data-flow="left"
                onClick={showHighchartsModal}
            >
                <i className="icon-info-sign" />
            </button>
        );
    }
}
