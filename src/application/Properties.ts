/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { Class } from '../types/Class.js';

import { Canvas as CanvasImpl } from './Canvas.js';
import { Canvas as CanvasType } from './interfaces/Canvas.js';

import { ComponentFactory } from './interfaces/ComponentFactory.js';
import { ComponentFactory as FactoryImpl } from './ComponentFactory.js';

import { Tag } from './tags/Tag.js';
import { Root } from './tags/Root.js';
import { Field } from './tags/Field.js';
import { Include } from './tags/Include.js';
import { Foreach } from './tags/Foreach.js';
import { Indicator } from './tags/Indicator.js';
import { FilterIndicator } from './tags/FilterIndicator.js';

export enum ScrollDirection
{
	Up,
	Down
}

export interface ClassNames
{
	Invalid:string;
	RowIndicator:string;
	FilterIndicator:string;
}

export class Properties
{
	public static baseurl:string = "/";

	public static BindAttr:string = "from";
	public static RecordModeAttr:string = "mode";

	public static RootTag:string = "forms";
	public static IncludeTag:string = "include";
	public static ForeachTag:string = "foreach";

	public static IndicatorType:string = "row-indicator";
	public static FilterIndicatorType:string = "filter-indicator";

	public static AttributePrefix:string = "$";
	public static RequireAttributePrefix:boolean = false;

	public static DateDelimitors:string = "./-: ";
	public static TimeFormat:string = "HH:mm:ss";
	public static DateFormat:string = "DD-MM-YYYY";

	public static ParseTags:boolean = true;
	public static ParseEvents:boolean = true;

	public static Classes:ClassNames = {Invalid: "invalid", RowIndicator:"row-indicator", FilterIndicator:"filter-indicator"};

	public static CanvasImplementationClass:Class<CanvasType> = CanvasImpl;
	public static FactoryImplementation:ComponentFactory = new FactoryImpl();

	public static MouseScrollDirection:ScrollDirection = ScrollDirection.Up;

	public static getTagLibrary() : Map<string,Class<Tag>>
	{
		return(
			new Map<string,Class<Tag>>
			(
					[
						[Properties.RootTag,Root],
						[Properties.IncludeTag,Include]
					]
			));
	}

	public static getTypeLibrary() : Map<string,Class<Tag>>
	{
		return(
			new Map<string,Class<Tag>>
			(
					[
						[Properties.IndicatorType,Indicator],
						[Properties.FilterIndicatorType,FilterIndicator]
					]
			));
	}

	public static getAttributeLibrary() : Map<string,Class<Tag>>
	{
		return(
			new Map<string,Class<Tag>>
			(
					[
						[Properties.BindAttr,Field],
						[Properties.ForeachTag,Foreach]
					]
			));
	}
}