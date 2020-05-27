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
        const license = config.highcharts?.license ?? {};
        const licenseType = license.type ?? gettext('OEM');

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
                                {license.licensee && (
                                    <tr>
                                        <td>{gettext('Licensee:')}</td>
                                        <td>{license.licensee}</td>
                                    </tr>
                                )}
                                {license.contact && (
                                    <tr>
                                        <td>{gettext('Licensee Contact:')}</td>
                                        <td>
                                            <a href={`mailto:${license.contact}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {license.contact}
                                            </a>
                                        </td>
                                    </tr>
                                )}
                                {license.id && (
                                    <tr>
                                        <td>{gettext('License ID:')}</td>
                                        <td>{license.id}</td>
                                    </tr>
                                )}
                                {license.customer_id && (
                                    <tr>
                                        <td>{gettext('Customer Installation No.:')}</td>
                                        <td>{license.customer_id}</td>
                                    </tr>
                                )}
                                {license.expiry && (
                                    <tr>
                                        <td>{gettext('Expiry Date:')}</td>
                                        <td>{license.expiry}</td>
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
