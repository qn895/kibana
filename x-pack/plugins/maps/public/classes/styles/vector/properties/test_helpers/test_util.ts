/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// eslint-disable-next-line max-classes-per-file
import { FIELD_ORIGIN, LAYER_STYLE_TYPE } from '../../../../../../common/constants';
import { StyleMeta } from '../../style_meta';
import { AbstractField, IField } from '../../../../fields/field';
import { IStyle } from '../../../style';

export class MockField extends AbstractField {
  private readonly _dataType: string;
  private readonly _supportsFieldMetaFromLocalData: boolean;

  constructor({
    fieldName,
    origin = FIELD_ORIGIN.SOURCE,
    dataType = 'string',
    supportsFieldMetaFromLocalData = true,
  }: {
    fieldName: string;
    origin?: FIELD_ORIGIN;
    dataType?: string;
    supportsFieldMetaFromLocalData?: boolean;
  }) {
    super({ fieldName, origin });
    this._dataType = dataType;
    this._supportsFieldMetaFromLocalData = supportsFieldMetaFromLocalData;
  }

  async getLabel(): Promise<string> {
    return this.getName() + '_label';
  }

  async getDataType(): Promise<string> {
    return this._dataType;
  }

  supportsFieldMetaFromLocalData(): boolean {
    return this._supportsFieldMetaFromLocalData;
  }

  supportsFieldMetaFromEs(): boolean {
    return true;
  }
}

export const mockField: IField = new MockField({
  fieldName: 'foobar',
  origin: FIELD_ORIGIN.SOURCE,
});

export class MockStyle implements IStyle {
  private readonly _min: number;
  private readonly _max: number;

  constructor({ min = 0, max = 100 } = {}) {
    this._min = min;
    this._max = max;
  }

  renderEditor() {
    return null;
  }

  getType() {
    return LAYER_STYLE_TYPE.VECTOR;
  }

  getStyleMeta(): StyleMeta {
    return new StyleMeta({
      geometryTypes: {
        isPointsOnly: false,
        isLinesOnly: false,
        isPolygonsOnly: false,
      },
      fieldMeta: {
        foobar: {
          range: {
            min: this._min,
            max: this._max,
            delta: this._max - this._min,
          },
          categories: [
            {
              key: 'US',
              count: 10,
            },
            {
              key: 'CN',
              count: 8,
            },
          ],
        },
      },
    });
  }
}

export class MockLayer {
  private readonly _style: IStyle;
  constructor(style = new MockStyle()) {
    this._style = style;
  }
  getStyle() {
    return this._style;
  }

  getDataRequest() {
    return null;
  }
}
