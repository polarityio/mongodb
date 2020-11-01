'use strict';

polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  fields: Ember.computed.alias('details.fields'),
  isUpdating: false,
  message: '',
  globalErrorObject: null,
  showAddModal: false,
  fieldNameToAdd: '',
  isCached: Ember.computed('block.isCached', function () {
    return this.get('block.isCached');
  }),
  addableFields: Ember.computed('block.userOptions.addableFields', 'details.keys', function () {
    const addableFields = this.get('block.userOptions.addableFields');
    const keys = this.get('details.keys');
    console.info(keys);
    return addableFields.split(',').reduce((accum, field) => {
      field = field.trim();
      // if a field already exists in the data, then we don't want to include it as an addable field
      // instead the field can just be edited.
      if (field.length > 0 && typeof keys[field] === 'undefined') {
        accum.push(field);
      }
      return accum;
    }, []);
  }),
  onDetailsError(err) {
    this.setError(err);
  },
  setError(err) {
    console.error('onDetailsError Handler', err);
    if (err.meta) {
      err = err.meta;
    }
    if (!err.detail) {
      err.detail = 'Unexpected error encountered';
    }
    this.set('globalErrorObject', err);
  },
  actions: {
    toggleBlock: function (blockId) {
      // document.querySelector
      // document.querySelectorAll()
      alert(blockId);
      // toggle visibility of class `block-id-${blockId}`
      const element = document.querySelector(`.block-id-${blockId}`);
      element.classList.toggle('invisible');
    },
    refreshDocument: function () {
      this.set('block.isLoadingDetails', true);
      const payload = {
        action: 'REFRESH_DOCUMENT',
        id: this.get('details.id')
      };

      this.sendIntegrationMessage(payload)
        .then((result) => {
          this.set('block.data.details', result);
        })
        .catch((err) => {
          this.setError(err);
        })
        .finally(() => {
          this.set('block.isLoadingDetails', false);
        });
    },
    updateDocument: function (index) {
      this.set('isUpdating', true);
      const payload = {
        action: 'UPDATE_FIELD',
        id: this.get('details.id'),
        key: this.get(`fields.${index}.key`),
        value: this.get('shadowUpdateValue')
      };

      this.sendIntegrationMessage(payload)
        .then((result) => {
          this.set('block.data.details', result);
          this.set('message', result.detail);
          Ember.run.later(() => {
            this.set('message', '');
          }, 3000);
        })
        .catch((err) => {
          this.setError(err);
        })
        .finally(() => {
          this.set('isUpdating', false);
          this.set(`fields.${index}.__showUpdateModal`, false);
        });
    },
    hideUpdateModal: function (index) {
      this.set(`fields.${index}.__showUpdateModal`, false);
    },
    showUpdateModal: function (index) {
      this._closeAllModals();
      this.set(`fields.${index}.__showUpdateModal`, true);
      this.set('shadowUpdateValue', this.get(`fields.${index}.value`));
    },
    showAddModal: function (show, addableField) {
      this._closeAllModals();
      this.set('shadowUpdateValue', '');
      this.set('fieldNameToAdd', addableField);
      this.set('showAddModal', show);
    },
    addField: function () {
      this.set('isUpdating', true);
      const payload = {
        action: 'ADD_FIELD',
        id: this.get('details.id'),
        key: this.get('fieldNameToAdd'),
        value: this.get('shadowUpdateValue')
      };

      this.sendIntegrationMessage(payload)
        .then((result) => {
          this.set('block.data.details', result);
          this.set('message', result.detail);
          Ember.run.later(() => {
            this.set('message', '');
          }, 3000);
        })
        .catch((err) => {
          this.setError(err);
        })
        .finally(() => {
          this.set('isUpdating', false);
          this.set('showAddModal', false);
        });
    }
  },
  _closeAllModals() {
    const numFields = this.get('fields.length');
    for (let i = 0; i < numFields; i++) {
      this.set(`fields.${i}.__showUpdateModal`, false);
    }
  }
});
