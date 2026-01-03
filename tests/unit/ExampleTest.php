<?php

use PHPUnit\Framework\TestCase;

//using hello world tests
class ExampleTest extends TestCase
{
    public function testTrueIsTrue()
    {
        $this->assertTrue(true);
    }

    public function testArrayHasKey()
    {
        $array = ['k' => 'v'];
        $this->assertArrayHasKey('k', $array);
    }
}

