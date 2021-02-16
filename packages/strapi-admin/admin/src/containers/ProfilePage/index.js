import React, { useMemo } from 'react';
import { BackHeader, BaselineAlignment, auth, Select, Option, Row } from 'strapi-helper-plugin';
import { Padded, Text } from '@buffetjs/core';
import { Col } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { get } from 'lodash';
import { useIntl } from 'react-intl';
import { useTheme } from 'styled-components';
import ContainerFluid from '../../components/ContainerFluid';
import PageTitle from '../../components/PageTitle';
import SizedInput from '../../components/SizedInput';
import { Header } from '../../components/Settings';
import { useSettingsForm } from '../../hooks';
import { form, schema } from './utils';
import useLanguages from '../LanguageProvider/hooks/useLanguages';
import { languages, languageNativeNames } from '../../i18n';
import { Title, ProfilePageLabel } from './components';
import Bloc from '../../components/Bloc';

const ProfilePage = () => {
  const {
    main: { colors },
  } = useTheme();
  const { goBack } = useHistory();
  const { currentLanguage, selectLanguage } = useLanguages();
  const { formatMessage } = useIntl();

  const onSubmitSuccessCb = data => auth.setUserInfo(data);

  const [
    { formErrors, initialData, isLoading, modifiedData, showHeaderLoader, showHeaderButtonLoader },
    // eslint-disable-next-line no-unused-vars
    _,
    { handleCancel, handleChange, handleSubmit },
  ] = useSettingsForm('/admin/users/me', schema, onSubmitSuccessCb, [
    'email',
    'firstname',
    'lastname',
    'username',
  ]);

  const headerLabel = useMemo(() => {
    const userInfos = auth.getUserInfo();

    if (modifiedData) {
      return modifiedData.username || `${modifiedData.firstname} ${modifiedData.lastname}`;
    }

    return userInfos.username || `${userInfos.firstname} ${userInfos.lastname}`;
  }, [modifiedData]);

  return (
    <>
      <PageTitle title="User profile" />
      <BackHeader onClick={goBack} />

      <form onSubmit={handleSubmit}>
        <ContainerFluid padding="18px 30px 0 30px">
          <Header
            isLoading={showHeaderLoader}
            initialData={initialData}
            label={headerLabel}
            modifiedData={modifiedData}
            onCancel={handleCancel}
            showHeaderButtonLoader={showHeaderButtonLoader}
          />
        </ContainerFluid>

        <BaselineAlignment top size="3px" />

        {/* Experience block */}
        <Padded size="md" left right bottom>
          <Bloc isLoading={isLoading}>
            <Padded size="sm" top left right bottom>
              <Col>
                <Padded size="sm" top bottom>
                  <Title>
                    {formatMessage({ id: 'Settings.profile.form.section.profile.title' })}
                  </Title>
                </Padded>
              </Col>

              <Row>
                {Object.keys(form).map(key => (
                  <SizedInput
                    {...form[key]}
                    key={key}
                    error={formErrors[key]}
                    name={key}
                    onChange={handleChange}
                    value={get(modifiedData, key, '')}
                  />
                ))}
              </Row>
            </Padded>
          </Bloc>
        </Padded>

        {/* Password block */}
        <Padded size="md" left right bottom>
          <Bloc>
            <Padded size="sm" top left right bottom>
              <Col>
                <Padded size="sm" top bottom>
                  <Title>
                    {formatMessage({ id: 'Settings.profile.form.section.password.title' })}
                  </Title>
                </Padded>
              </Col>

              <Row>
                <SizedInput
                  label="Auth.form.password.label"
                  type="password"
                  autoComplete="new-password"
                  validations={{}}
                  error={formErrors.password}
                  name="password"
                  onChange={handleChange}
                  value={get(modifiedData, 'password', '')}
                />

                <SizedInput
                  label="Auth.form.confirmPassword.label"
                  type="password"
                  validations={{}}
                  error={formErrors.confirmPassword}
                  name="confirmPassword"
                  onChange={handleChange}
                  value={get(modifiedData, 'confirmPassword', '')}
                />
              </Row>
            </Padded>
          </Bloc>
        </Padded>

        {/* Interface block */}
        <Padded size="md" left right bottom>
          <Bloc>
            <Padded size="sm" top left right bottom>
              <Col>
                <Padded size="sm" top bottom>
                  <Title>
                    {formatMessage({ id: 'Settings.profile.form.section.experience.title' })}
                  </Title>
                </Padded>
              </Col>

              <div className="col-6">
                <ProfilePageLabel htmlFor="">
                  {formatMessage({
                    id: 'Settings.profile.form.section.experience.interfaceLanguage',
                  })}
                </ProfilePageLabel>

                <Select
                  aria-labelledby="interface-language"
                  selectedValue={currentLanguage}
                  onChange={selectLanguage}
                >
                  {languages.map(language => {
                    const langName = languageNativeNames[language];

                    return (
                      <Option value={language} key={language}>
                        {langName}
                      </Option>
                    );
                  })}
                </Select>

                <Padded size="sm" top bottom>
                  <Text color={colors.grey}>
                    {formatMessage({
                      id: 'Settings.profile.form.section.experience.interfaceLanguage.hint',
                    })}
                  </Text>
                </Padded>
              </div>
            </Padded>
          </Bloc>
        </Padded>
      </form>
    </>
  );
};

export default ProfilePage;
